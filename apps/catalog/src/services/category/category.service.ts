import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryTreeCacheService } from './category-tree.cache';
import { buildCategoryTree, mapCategory } from './category-tree.utils';
import { CategoryPublisher } from './category.publisher';
import { CategoryDocument, CategoryEntity } from './schemas/category.schema';
import { Category } from '../shared';
import { CategoryEventBus } from './category-events.bus';

@Injectable()
export class CategoryService {
	private readonly logger = new Logger(CategoryService.name);

	constructor(
		@InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
		private readonly categoryTreeCache: CategoryTreeCacheService,
		private readonly categoryPublisher: CategoryPublisher,
		private readonly categoryEvents: CategoryEventBus,
	) {}

	async createCategory(dto: CreateCategoryDto): Promise<Category> {
		const parentId = this.normalizeParentId(dto.parentId ?? null);
		await this.validateParentAssignment(null, parentId);

		const slug = await this.ensureUniqueSlug(dto.slug ?? this.slugify(dto.name));
		const sortIndex = dto.sortIndex ?? (await this.getNextSortIndex(parentId));
		const localeNames = this.normalizeLocaleNames(dto.localeNames);

		const category = await this.categoryModel.create({
			name: dto.name,
			slug,
			parentId,
			sortIndex,
			isVisible: dto.isVisible ?? true,
			localeNames,
		});

		await this.afterCategoryMutation(category, 'created');
		return mapCategory(category);
	}

	async listCategories(): Promise<Category[]> {
		const categories = await this.categoryModel
			.find()
			.sort({ sortIndex: 1, name: 1 })
			.lean({ virtuals: true })
			.exec();
		return categories.map((item) => mapCategory(item));
	}

	async listCategoryTree(): Promise<Category[]> {
		try {
			return await this.categoryTreeCache.getTree();
		} catch (error) {
			const err = error as Error;
			this.logger.warn(`Category tree cache failed, falling back to DB: ${err?.message}`);
			const categories = await this.categoryModel.find().lean({ virtuals: true }).exec();
			const mapped = categories.map((item) => mapCategory(item));
			return buildCategoryTree(mapped);
		}
	}

	async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
		const category = await this.categoryModel.findById(id).exec();
		if (!category) {
			throw new NotFoundException(`Category ${id} not found`);
		}

		if (dto.parentId !== undefined) {
			const targetParent = this.normalizeParentId(dto.parentId ?? null);
			await this.validateParentAssignment(id, targetParent);
			category.parentId = targetParent;
		}

		if (dto.name !== undefined) {
			category.name = dto.name;
		}

		if (dto.slug !== undefined) {
			category.slug = await this.ensureUniqueSlug(this.slugify(dto.slug), id);
		} else if (dto.name !== undefined) {
			category.slug = await this.ensureUniqueSlug(this.slugify(category.name), id);
		}

		if (dto.sortIndex !== undefined) {
			category.sortIndex = dto.sortIndex;
		}

		if (dto.isVisible !== undefined) {
			category.isVisible = dto.isVisible;
		}

		if (dto.localeNames !== undefined) {
			category.localeNames = this.normalizeLocaleNames(dto.localeNames);
		}

		await category.save();
		await this.afterCategoryMutation(category, 'updated');

		return mapCategory(category);
	}

	private normalizeParentId(value?: string | null): string | null {
		if (value === null || value === undefined) {
			return null;
		}
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	private normalizeLocaleNames(entries?: { locale: string; label: string }[]): Record<string, string> {
		if (!entries) {
			return {};
		}
		return entries.reduce<Record<string, string>>((acc, entry) => {
			const locale = entry.locale?.trim();
			const label = entry.label?.trim();
			if (locale && label) {
				acc[locale] = label;
			}
			return acc;
		}, {});
	}

	private slugify(input: string): string {
		return (
			input
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.slice(0, 120) || 'category'
		);
	}

	private async ensureUniqueSlug(baseSlug: string, currentId?: string | null): Promise<string> {
		let slug = baseSlug;
		let counter = 1;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const conflict = await this.categoryModel.exists({
				slug,
				...(currentId ? { _id: { $ne: currentId } } : {}),
			});
			if (!conflict) {
				return slug;
			}
			slug = `${baseSlug}-${counter++}`;
		}
	}

	private async getNextSortIndex(parentId: string | null): Promise<number> {
		const count = await this.categoryModel.countDocuments({ parentId }).exec();
		return count;
	}

	private async validateParentAssignment(currentId: string | null, parentId: string | null): Promise<void> {
		if (!parentId) {
			return;
		}
		if (currentId && parentId === currentId) {
			throw new BadRequestException('Category cannot be its own parent');
		}
		const parentExists = await this.categoryModel.exists({ _id: parentId });
		if (!parentExists) {
			throw new BadRequestException(`Parent category ${parentId} does not exist`);
		}
		if (currentId && (await this.isDescendant(parentId, currentId))) {
			throw new BadRequestException('Parent cannot be a descendant');
		}
	}

	private async isDescendant(candidateId: string, targetId: string): Promise<boolean> {
		if (candidateId === targetId) {
			return true;
		}
		const categories = await this.categoryModel
			.find({}, { _id: 1, parentId: 1 })
			.lean({ virtuals: true })
			.exec();
		const lookup = new Map<string, string | null>();
		categories.forEach((category) => {
			lookup.set(String(category._id), category.parentId ?? null);
		});

		let cursor: string | undefined = candidateId;
		const guard = new Set<string>();
		while (cursor) {
			if (cursor === targetId) {
				return true;
			}
			if (guard.has(cursor)) {
				break;
			}
			guard.add(cursor);
			const next = lookup.get(cursor);
			if (!next) {
				return false;
			}
			cursor = next ?? undefined;
		}
		return false;
	}

	private async afterCategoryMutation(
		category: CategoryDocument,
		action: 'created' | 'updated' | 'deleted',
	): Promise<void> {
		try {
			const mapped = mapCategory(category);
			this.categoryEvents.emitCategoryChanged({
				categoryId: mapped.id,
				action,
				category: mapped,
			});

			const path = await this.computeCategoryPath(mapped.id);
			await this.categoryPublisher.publishCategoryChanged({
				categoryId: mapped.id,
				slug: mapped.slug,
				name: mapped.name,
				parentId: mapped.parentId,
				sortIndex: mapped.sortIndex,
				isVisible: mapped.isVisible,
				path,
				action,
			});
		} catch (error) {
			const err = error as Error;
			this.logger.warn(`Failed to publish category event: ${err?.message}`);
		}
	}

	private async computeCategoryPath(categoryId: string): Promise<string[]> {
		const categories = await this.categoryModel
			.find({}, { _id: 1, parentId: 1, slug: 1 })
			.lean({ virtuals: true })
			.exec();

		const lookup = new Map<string, { parentId: string | null; slug: string }>();
		categories.forEach((category) => {
			lookup.set(String(category._id), {
				parentId: category.parentId ?? null,
				slug: category.slug,
			});
		});

		const path: string[] = [];
		let cursor: string | undefined = categoryId;
		const guard = new Set<string>();
		while (cursor) {
			if (guard.has(cursor)) {
				break;
			}
			guard.add(cursor);
			const details = lookup.get(cursor);
			if (!details) {
				break;
			}
			path.unshift(details.slug);
			cursor = details.parentId ?? undefined;
		}
		return path;
	}
}

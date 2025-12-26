import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyBulkWriteOperation } from 'mongodb';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CategoryEntity, CategoryDocument } from '../category/schemas/category.schema';
import {
	OptionDefinition,
	Product as ProductEntity,
	ProductDocument,
} from './schemas/product.schema';
import {
	VariantCollection,
	VariantCollectionDocument,
} from './schemas/variant-collection.schema';
import { Attribute, Product, ProductStatus, Variant } from '../shared';
import { ProductMapper } from './product.mapper';
import { ProductOptionsService } from './product-options.service';
import { ProductListResult, VariantCollectionDoc, VariantDoc } from './product.types';
import { ProductPublisher } from './product.publisher';
import { ProductEventBus, ProductMutationAction } from './product-events.bus';
import { CategoryBreadcrumbNode, ProductChangedEventPayload } from '@app/events';

interface CategorySummary {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
}

@Injectable()
export class ProductService {
	private readonly useVariantCollection: boolean;
	private readonly logger = new Logger(ProductService.name);

	constructor(
		@InjectModel(ProductEntity.name) private readonly productModel: Model<ProductDocument>,
		@InjectModel(VariantCollection.name)
		private readonly variantCollectionModel: Model<VariantCollectionDocument>,
		@InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
		private readonly config: ConfigService,
		private readonly mapper: ProductMapper,
		private readonly options: ProductOptionsService,
		private readonly productPublisher: ProductPublisher,
		private readonly productEvents: ProductEventBus,
	) {
			const flag = (this.config.get<string>('CATALOG_USE_VARIANT_COLLECTION') ?? '').toLowerCase();
			// this.useVariantCollection = flag ? flag === 'true' : true;
			this.useVariantCollection = true;
	}

	async createProduct(dto: CreateProductDto): Promise<Product> {
		await this.assertCategoryAssignment(dto.categoryId, dto.subCategoryId ?? null);

		const options = this.options.normalizeOptionDefinitions(dto.options ?? []);

		const productId = new Types.ObjectId();
		const combinationKeys = new Set<string>();
		const variantsWithKeys = (dto.variants ?? []).map((variantDto) =>
			this.buildVariant(productId.toString(), variantDto, options, combinationKeys),
		);

		const baseProductPayload = {
			_id: productId,
			name: dto.name,
			description: dto.description,
			categoryId: dto.categoryId,
			subCategoryId: dto.subCategoryId ?? null,
			vendorId: dto.vendorId,
			basePrice: dto.basePrice,
			attributes: dto.attributes ?? [],
			options,
			variants: this.useVariantCollection
				? []
				: variantsWithKeys.map((variant) => ({
						...this.mapper.stripCombinationKey(variant),
						_id: variant.id,
					})),
			status: dto.status ?? 'pending',
		};

		const product = await this.productModel.create(baseProductPayload);

		if (this.useVariantCollection && variantsWithKeys.length > 0) {
			const payload = variantsWithKeys.map((variant) => ({
				...variant,
				_id: variant.id,
			}));
			try {
				await this.variantCollectionModel.insertMany(payload);
			} catch (error) {
				if (this.isDuplicateKeyError(error)) {
					throw new ConflictException('Variant option combination must be unique per product');
				}
				throw error;
			}
		}

		const mappedProduct = this.mapper.mapProduct(
			product,
			this.useVariantCollection ? variantsWithKeys : undefined,
		);
		const [decoratedProduct] = await this.populateBreadcrumbs([mappedProduct]);
		const finalProduct = decoratedProduct ?? mappedProduct;
		await this.emitProductChanged(finalProduct, 'created');
		return finalProduct;
	}

	async listProducts(query: ListProductsQueryDto): Promise<ProductListResult> {
		const {
			vendorId,
			status,
			categoryId,
			subCategoryId,
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortDir = 'desc',
		} = query;

		const filter: Record<string, unknown> = {};
		if (vendorId) filter.vendorId = vendorId;
		if (status) filter.status = status;
		if (categoryId) filter.categoryId = categoryId;
		if (subCategoryId) filter.subCategoryId = subCategoryId;

		const sortDirection = sortDir === 'asc' ? 1 : -1;
		const [products, total] = await Promise.all([
			this.productModel
				.find(filter)
				.sort({ [sortBy]: sortDirection })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean({ virtuals: true })
				.exec(),
			this.productModel.countDocuments(filter),
		]);

		let mappedProducts: Product[];
		if (!this.useVariantCollection) {
			mappedProducts = products.map((product) => this.mapper.mapProduct(product));
		} else {
			const productIds = products.map((p) => p.id ?? String(p._id));
			const variants = await this.variantCollectionModel
				.find({ productId: { $in: productIds } })
				.lean({ virtuals: true })
				.exec();

			const byProduct = new Map<string, VariantCollectionDoc[]>();
			for (const variant of variants) {
				const pid = variant.productId;
				byProduct.set(pid, [...(byProduct.get(pid) ?? []), variant]);
			}

			mappedProducts = products.map((product) =>
				this.mapper.mapProduct(product, byProduct.get(product.id ?? String(product._id)) ?? []),
			);
		}

		mappedProducts = await this.populateBreadcrumbs(mappedProducts);

		return {
			items: mappedProducts,
			total,
			page,
			limit,
			hasNext: page * limit < total,
		};
	}

	async getProduct(id: string): Promise<Product> {
		const product = await this.productModel.findById(id).lean({ virtuals: true }).exec();
		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}
		if (!this.useVariantCollection) {
			const mapped = this.mapper.mapProduct(product);
			const [decorated] = await this.populateBreadcrumbs([mapped]);
			return decorated ?? mapped;
		}
		const variants = await this.variantCollectionModel
			.find({ productId: id })
			.lean({ virtuals: true })
			.exec();
		const mapped = this.mapper.mapProduct(product, variants);
		const [decorated] = await this.populateBreadcrumbs([mapped]);
		return decorated ?? mapped;
	}

	async addVariant(productId: string, dto: CreateVariantDto): Promise<Variant> {
		const product = await this.productModel.findById(productId).lean({ virtuals: true }).exec();
		if (!product) {
			throw new NotFoundException(`Product ${productId} not found`);
		}

		const options = this.options.normalizeOptionDefinitions(product.options ?? []);

		if (this.useVariantCollection) {
			const normalizedAttributes = this.options.normalizeAttributesForOptions(dto.attributes ?? [], options);
			const combinationKey = this.options.buildCombinationKey(normalizedAttributes);

			const existing = await this.variantCollectionModel
				.findOne({ productId, combinationKey })
				.select('_id')
				.lean()
				.exec();
			if (existing) {
				throw new ConflictException('Variant option combination must be unique per product');
			}

			const variant = this.buildVariant(productId, dto, options, new Set());

			try {
				const created = await this.variantCollectionModel.create({
					...variant,
					_id: variant.id,
				});
				const mappedVariant = this.mapper.mapVariant(created);
				await this.emitVariantChanged(mappedVariant, 'created');
				await this.emitProductChanged(await this.getProduct(productId), 'updated');
				return mappedVariant;
			} catch (error) {
				if (this.isDuplicateKeyError(error)) {
					throw new ConflictException('Variant option combination must be unique per product');
				}
				throw error;
			}
		}

		const combinationKeys = new Set<string>(
			(product.variants ?? []).map((v) =>
				this.options.buildCombinationKey(
					this.options.normalizeAttributesForOptions(v.attributes ?? [], options),
				),
			),
		);
		const variant = this.buildVariant(productId, dto, options, combinationKeys);

		const updated = await this.productModel
			.findByIdAndUpdate(
				productId,
				{ $push: { variants: { ...this.mapper.stripCombinationKey(variant), _id: variant.id } } },
				{ new: true },
			)
			.lean({ virtuals: true })
			.exec();

		if (!updated) {
			throw new NotFoundException(`Product ${productId} not found`);
		}

		const mappedVariant = this.mapper.mapVariant(variant);
		await this.emitVariantChanged(mappedVariant, 'created');
		await this.emitProductChanged(await this.getProduct(productId), 'updated');
		return mappedVariant;
	}

	async listVariants(productId: string): Promise<Variant[]> {
		if (this.useVariantCollection) {
			const productExists = await this.productModel.exists({ _id: productId });
			if (!productExists) {
				throw new NotFoundException(`Product ${productId} not found`);
			}

			const variants = await this.variantCollectionModel
				.find({ productId })
				.lean({ virtuals: true })
				.exec();
			return variants.map((variant) => this.mapper.mapVariant(variant));
		}

		const product = await this.productModel
			.findById(productId, { variants: 1, options: 1 })
			.lean({ virtuals: true })
			.exec();
		if (!product) {
			throw new NotFoundException(`Product ${productId} not found`);
		}
		return (product.variants ?? []).map((variant) => this.mapper.mapVariant(variant));
	}

	async updateVariant(productId: string, variantId: string, dto: UpdateVariantDto): Promise<Variant> {
		const projection = this.useVariantCollection ? { options: 1 } : { options: 1, variants: 1 };
		const product = await this.productModel
			.findById(productId, projection)
			.lean({ virtuals: true })
			.exec();
		if (!product) {
			throw new NotFoundException(`Product ${productId} not found`);
		}

		const options = this.options.normalizeOptionDefinitions(product.options ?? []);

		if (this.useVariantCollection) {
			const updatePayload: Record<string, unknown> = {};
			if (dto.sku !== undefined) {
				updatePayload.sku = dto.sku;
			}
			if (dto.price !== undefined) {
				updatePayload.price = dto.price;
			}
			if (dto.stock !== undefined) {
				updatePayload.stock = dto.stock;
			}

			if (dto.attributes !== undefined) {
				const normalizedAttributes = this.options.normalizeAttributesForOptions(dto.attributes ?? [], options);
				const combinationKey = this.options.buildCombinationKey(normalizedAttributes);
				const duplicate = await this.variantCollectionModel.exists({
					productId,
					combinationKey,
					_id: { $ne: variantId },
				});
				if (duplicate) {
					throw new ConflictException('Variant option combination must be unique per product');
				}
				updatePayload.attributes = normalizedAttributes;
				updatePayload.combinationKey = combinationKey;
			}

			const updated = await this.variantCollectionModel
				.findOneAndUpdate({ _id: variantId, productId }, { $set: updatePayload }, { new: true })
				.lean({ virtuals: true })
				.exec();

			if (!updated) {
				throw new NotFoundException(`Variant ${variantId} not found for product ${productId}`);
			}

			const mappedVariant = this.mapper.mapVariant(updated);
			await this.emitVariantChanged(mappedVariant, 'updated');
			await this.emitProductChanged(await this.getProduct(productId), 'updated');
			return mappedVariant;
		}

		const variants = product.variants ?? [];
		const index = variants.findIndex((variant) => {
			const variantWithIds = variant as Variant & { _id?: unknown; id?: string };
			const resolvedId = variantWithIds._id ?? variantWithIds.id;
			return String(resolvedId) === variantId;
		});
		if (index === -1) {
			throw new NotFoundException(`Variant ${variantId} not found for product ${productId}`);
		}

		const target = variants[index];
		const updatedVariant: VariantDoc = {
			...target,
			sku: dto.sku ?? target.sku,
			price: dto.price ?? target.price,
			stock: dto.stock ?? target.stock,
			attributes: dto.attributes ?? target.attributes,
		};

		const combinationKeys = new Set<string>();
		variants.forEach((variant, idx) => {
			if (idx === index) {
				return;
			}
			const normalized = this.options.normalizeAttributesForOptions(variant.attributes ?? [], options);
			const key = this.options.buildCombinationKey(normalized);
			combinationKeys.add(key);
		});

		const normalizedAttributes = this.options.normalizeAttributesForOptions(updatedVariant.attributes ?? [], options);
		const nextCombinationKey = this.options.buildCombinationKey(normalizedAttributes);
		if (combinationKeys.has(nextCombinationKey)) {
			throw new ConflictException('Variant option combination must be unique per product');
		}

		variants[index] = {
			...(updatedVariant as VariantDoc),
			attributes: normalizedAttributes,
		};

		await this.productModel.updateOne(
			{ _id: productId },
			{
				$set: {
					variants: variants.map((variant) => {
						const variantWithIds = variant as Variant & { _id?: unknown; id?: string };
						const resolvedId = variantWithIds._id ?? variantWithIds.id;
						return {
							_id: resolvedId,
							productId: variant.productId,
							sku: variant.sku,
							price: variant.price,
							stock: variant.stock,
							attributes: variant.attributes,
						};
					}),
				},
			},
		);

		const mappedVariant = this.mapper.mapVariant(variants[index]);
		await this.emitVariantChanged(mappedVariant, 'updated');
		await this.emitProductChanged(await this.getProduct(productId), 'updated');
		return mappedVariant;
	}

	async deleteVariant(productId: string, variantId: string): Promise<Variant> {
		if (this.useVariantCollection) {
			const deleted = await this.variantCollectionModel
				.findOneAndDelete({ _id: variantId, productId })
				.lean({ virtuals: true })
				.exec();
			if (!deleted) {
				throw new NotFoundException(`Variant ${variantId} not found for product ${productId}`);
			}
			const mappedVariant = this.mapper.mapVariant(deleted);
			await this.emitVariantChanged(mappedVariant, 'deleted');
			await this.emitProductChanged(await this.getProduct(productId), 'updated');
			return mappedVariant;
		}

		const product = await this.productModel
			.findById(productId, { variants: 1 })
			.lean({ virtuals: true })
			.exec();
		if (!product) {
			throw new NotFoundException(`Product ${productId} not found`);
		}

		const variants = product.variants ?? [];
		const index = variants.findIndex((variant) => {
			const variantWithIds = variant as Variant & { _id?: unknown; id?: string };
			const resolvedId = variantWithIds._id ?? variantWithIds.id;
			return String(resolvedId) === variantId;
		});
		if (index === -1) {
			throw new NotFoundException(`Variant ${variantId} not found for product ${productId}`);
		}

		const [removed] = variants.splice(index, 1);

		await this.productModel.updateOne(
			{ _id: productId },
			{ $set: { variants: variants.map((variant) => {
				const variantWithIds = variant as Variant & { _id?: unknown; id?: string };
				const resolvedId = variantWithIds._id ?? variantWithIds.id;
				return {
					_id: resolvedId,
					productId: variant.productId,
					sku: variant.sku,
					price: variant.price,
					stock: variant.stock,
					attributes: variant.attributes,
				};
			}) } },
		);

		const mappedVariant = this.mapper.mapVariant(removed as VariantDoc);
		await this.emitVariantChanged(mappedVariant, 'deleted');
		await this.emitProductChanged(await this.getProduct(productId), 'updated');
		return mappedVariant;
	}

	async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
		const existing = await this.productModel.findById(id).lean({ virtuals: true }).exec();
		if (!existing) {
			throw new NotFoundException(`Product ${id} not found`);
		}

		const updatePayload: Record<string, unknown> = {};

		if (dto.name !== undefined) {
			updatePayload.name = dto.name;
		}
		if (dto.description !== undefined) {
			updatePayload.description = dto.description;
		}
		if (dto.basePrice !== undefined) {
			updatePayload.basePrice = dto.basePrice;
		}
		if (dto.attributes !== undefined) {
			updatePayload.attributes = dto.attributes;
		}
		const targetCategoryId = dto.categoryId ?? existing.categoryId;
		let targetSubCategoryId: string | null = existing.subCategoryId ?? null;
		let shouldPersistSubCategory = false;
		if (dto.subCategoryId !== undefined) {
			// allow explicit null to clear existing assignment
			targetSubCategoryId = dto.subCategoryId ?? null;
			shouldPersistSubCategory = true;
		} else if (dto.categoryId !== undefined && existing.subCategoryId) {
			// reset dangling subcategory if category changes without explicit override
			targetSubCategoryId = null;
			shouldPersistSubCategory = true;
		}

		if (
			targetCategoryId !== existing.categoryId ||
			shouldPersistSubCategory ||
			(targetSubCategoryId ?? null) !== (existing.subCategoryId ?? null)
		) {
			await this.assertCategoryAssignment(targetCategoryId, targetSubCategoryId);
		}

		if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) {
			updatePayload.categoryId = dto.categoryId;
		}

		if (shouldPersistSubCategory) {
			updatePayload.subCategoryId = targetSubCategoryId;
		}

		if (dto.options !== undefined) {
			const normalizedOptions = this.options.normalizeOptionDefinitions(dto.options);
			await this.reconcileVariantsForOptions(id, normalizedOptions);
			updatePayload.options = normalizedOptions;
		}

		if (Object.keys(updatePayload).length === 0) {
			return this.getProduct(id);
		}

		const updated = await this.productModel
			.findByIdAndUpdate(id, updatePayload, { new: true })
			.lean({ virtuals: true })
			.exec();

		if (!updated) {
			throw new NotFoundException(`Product ${id} not found`);
		}

		const hydrated = await this.getProduct(id);
		await this.emitProductChanged(hydrated, 'updated');
		return hydrated;
	}

	async updateProductStatus(
			id: string,
			status: 'pending' | 'approved' | 'rejected',
		): Promise<Product> {
			const existing = await this.productModel.findById(id).lean({ virtuals: true }).exec();
			if (!existing) {
				throw new NotFoundException(`Product ${id} not found`);
			}

			const normalizedStatus = status as ProductStatus;
			const currentStatus = (existing.status as ProductStatus | undefined) ?? ProductStatus.PENDING;
			if (currentStatus === normalizedStatus) {
				throw new BadRequestException(`Product already ${status}`);
			}

			const allowedTransitions: Record<ProductStatus, ProductStatus[]> = {
				[ProductStatus.PENDING]: [ProductStatus.APPROVED, ProductStatus.REJECTED],
				[ProductStatus.APPROVED]: [ProductStatus.REJECTED],
				[ProductStatus.REJECTED]: [ProductStatus.PENDING],
			};
			if (!(allowedTransitions[currentStatus] ?? []).includes(normalizedStatus)) {
				throw new BadRequestException(
					`Cannot transition product ${id} from ${currentStatus} to ${status}`,
				);
			}

			const product = await this.productModel
				.findByIdAndUpdate(id, { status: normalizedStatus }, { new: true })
				.lean({ virtuals: true })
				.exec();

			if (!product) {
				throw new NotFoundException(`Product ${id} not found`);
			}

			const mapped = await this.getProduct(id);
			await this.emitProductChanged(mapped, 'updated');
			return mapped;
	}

	private async emitProductChanged(product: Product, action: ProductMutationAction): Promise<void> {
		try {
			this.productEvents.emitProductChanged({ productId: product.id, action, product });
			await this.productPublisher.publishProductChanged({
				productId: product.id,
				action,
				product: this.toProductSnapshot(product),
			});
		} catch (error) {
			const err = error as Error;
			this.logger.warn(`Failed to propagate product event for ${product.id}: ${err.message}`);
		}
	}

	private async emitVariantChanged(variant: Variant, action: ProductMutationAction): Promise<void> {
		try {
			this.productEvents.emitVariantChanged({
				productId: variant.productId,
				variantId: variant.id,
				action,
				variant,
			});
			await this.productPublisher.publishVariantChanged({
				productId: variant.productId,
				variantId: variant.id,
				action,
				variant,
			});
		} catch (error) {
			const err = error as Error;
			this.logger.warn(
				`Failed to propagate variant event for ${variant.id} (product ${variant.productId}): ${err.message}`,
			);
		}
	}

	private toProductSnapshot(product: Product): ProductChangedEventPayload['product'] {
		return {
			id: product.id,
			name: product.name,
			description: product.description,
			categoryId: product.categoryId,
			subCategoryId: product.subCategoryId ?? null,
			vendorId: product.vendorId,
			basePrice: product.basePrice,
			attributes: product.attributes ?? [],
			options: product.options ?? [],
			status: product.status,
			categoryBreadcrumb: product.categoryBreadcrumb ?? [],
			variants: (product.variants ?? []).map((variant) => ({
				id: variant.id,
				productId: variant.productId,
				sku: variant.sku,
				price: variant.price,
				stock: variant.stock,
				attributes: variant.attributes ?? [],
			})),
		};
	}

	private buildVariant(
		productId: string,
		dto: CreateVariantDto,
		options: OptionDefinition[],
		combinationKeys: Set<string>,
	): Variant & { combinationKey: string } {
		const normalizedAttributes = this.options.normalizeAttributesForOptions(dto.attributes ?? [], options);
		const combinationKey = this.options.buildCombinationKey(normalizedAttributes);
		if (combinationKeys.has(combinationKey)) {
			throw new ConflictException('Variant option combination must be unique per product');
		}
		combinationKeys.add(combinationKey);

		return {
			id: new Types.ObjectId().toString(),
			productId,
			sku: dto.sku,
			price: dto.price,
			stock: dto.stock ?? 0,
			attributes: normalizedAttributes,
			combinationKey,
		};
	}

	private async populateBreadcrumbs<T extends { categoryId: string; subCategoryId?: string | null; categoryBreadcrumb?: CategoryBreadcrumbNode[] }>(
		products: T[],
	): Promise<T[]> {
		if (products.length === 0) {
			return products;
		}
		const leafIds = Array.from(
			new Set(
				products
					.map((product) => product.subCategoryId ?? product.categoryId)
					.filter((value): value is string => Boolean(value)),
			),
		);
		if (leafIds.length === 0) {
			products.forEach((product) => {
				product.categoryBreadcrumb = [];
			});
			return products;
		}
		const lookup = await this.buildCategoryLookup(leafIds);
		products.forEach((product) => {
			product.categoryBreadcrumb = this.buildCategoryBreadcrumb(
				lookup,
				product.subCategoryId ?? product.categoryId,
			);
		});
		return products;
	}

	private async buildCategoryLookup(seedIds: string[]): Promise<Map<string, CategorySummary>> {
		const lookup = new Map<string, CategorySummary>();
		const queue = new Set(seedIds.filter((value): value is string => Boolean(value)));
		while (queue.size > 0) {
			const ids = Array.from(queue);
			queue.clear();
			const categories = await this.categoryModel
				.find({ _id: { $in: ids } }, { name: 1, slug: 1, parentId: 1 })
				.lean({ virtuals: true })
				.exec();
			for (const category of categories) {
				const id = String(category._id);
				if (lookup.has(id)) {
					continue;
				}
				const summary: CategorySummary = {
					id,
					name: category.name,
					slug: category.slug,
					parentId: category.parentId ?? null,
				};
				lookup.set(id, summary);
				const parentId = category.parentId ?? null;
				if (parentId && !lookup.has(parentId)) {
					queue.add(parentId);
				}
			}
		}
		return lookup;
	}

	private buildCategoryBreadcrumb(
		lookup: Map<string, CategorySummary>,
		leafCategoryId?: string | null,
	): CategoryBreadcrumbNode[] {
		if (!leafCategoryId) {
			return [];
		}
		const breadcrumb: CategoryBreadcrumbNode[] = [];
		let cursor: string | undefined | null = leafCategoryId;
		const guard = new Set<string>();
		while (cursor) {
			if (guard.has(cursor)) {
				break;
			}
			guard.add(cursor);
			const node = lookup.get(cursor);
			if (!node) {
				break;
			}
			breadcrumb.unshift({ id: node.id, name: node.name, slug: node.slug });
			cursor = node.parentId ?? undefined;
		}
		return breadcrumb;
	}

	private async assertCategoryAssignment(categoryId: string, subCategoryId?: string | null): Promise<void> {
		if (!categoryId) {
			throw new BadRequestException('categoryId is required');
		}
		const categoryExists = await this.categoryModel.exists({ _id: categoryId });
		if (!categoryExists) {
			throw new BadRequestException(`Category ${categoryId} does not exist`);
		}
		if (!subCategoryId) {
			return;
		}
		if (subCategoryId === categoryId) {
			throw new BadRequestException('subCategoryId must reference a descendant leaf of categoryId');
		}
		const subCategory = await this.categoryModel
			.findById(subCategoryId, { parentId: 1 })
			.lean({ virtuals: true })
			.exec();
		if (!subCategory) {
			throw new BadRequestException(`Subcategory ${subCategoryId} does not exist`);
		}
		const hasChildren = await this.categoryModel.exists({ parentId: subCategoryId });
		if (hasChildren) {
			throw new BadRequestException('subCategoryId must be a leaf node without children');
		}
		let cursor = subCategory.parentId ?? null;
		const guard = new Set<string>([subCategoryId]);
		while (cursor) {
			if (cursor === categoryId) {
				return;
			}
			if (guard.has(cursor)) {
				break;
			}
			guard.add(cursor);
			const parent = await this.categoryModel
				.findById(cursor, { parentId: 1 })
				.lean({ virtuals: true })
				.exec();
			if (!parent) {
				break;
			}
			cursor = parent.parentId ?? null;
		}
		throw new BadRequestException(
			`Subcategory ${subCategoryId} must belong to category ${categoryId} and be the deepest node`,
		);
	}


	private isDuplicateKeyError(error: unknown): boolean {
		return Boolean(error && typeof error === 'object' && (error as any).code === 11000);
	}

	private async reconcileVariantsForOptions(
		productId: string,
		options: OptionDefinition[],
	): Promise<void> {
		if (options.length === 0) {
			return;
		}
		if (this.useVariantCollection) {
			const variants = await this.variantCollectionModel
				.find({ productId })
				.select('+combinationKey')
				.lean({ virtuals: true })
				.exec();

			if (variants.length === 0) {
				return;
			}

			const combinationKeys = new Set<string>();
			const updates: AnyBulkWriteOperation<VariantCollection>[] = [];

			for (const variant of variants) {
				const normalizedAttributes = this.options.normalizeAttributesForOptions(variant.attributes ?? [], options);
				const combinationKey = this.options.buildCombinationKey(normalizedAttributes);
				if (combinationKeys.has(combinationKey)) {
					throw new ConflictException('Variant option combination must be unique per product');
				}
				combinationKeys.add(combinationKey);

				const needsUpdate =
					!this.options.areAttributesEqual(normalizedAttributes, variant.attributes ?? []) ||
					combinationKey !== (variant as any).combinationKey;

				if (needsUpdate) {
					updates.push({
						updateOne: {
							filter: { _id: variant._id },
							update: { attributes: normalizedAttributes, combinationKey },
						},
					});
				}
			}

			if (updates.length > 0) {
				await this.variantCollectionModel.bulkWrite(updates);
			}
			return;
		}

		const product = await this.productModel
			.findById(productId, { variants: 1 })
			.lean({ virtuals: true })
			.exec();

		if (!product || (product.variants ?? []).length === 0) {
			return;
		}

		const combinationKeys = new Set<string>();
		let needsUpdate = false;
		const normalizedVariants = (product.variants ?? []).map((variant) => {
			const normalizedAttributes = this.options.normalizeAttributesForOptions(variant.attributes ?? [], options);
			const combinationKey = this.options.buildCombinationKey(normalizedAttributes);
			if (combinationKeys.has(combinationKey)) {
				throw new ConflictException('Variant option combination must be unique per product');
			}
			combinationKeys.add(combinationKey);
			if (!this.options.areAttributesEqual(normalizedAttributes, variant.attributes ?? [])) {
				needsUpdate = true;
			}
			return {
				...variant,
				attributes: normalizedAttributes,
			};
		});

		if (!needsUpdate) {
			return;
		}

		await this.productModel.updateOne(
			{ _id: productId },
			{
				$set: {
					variants: normalizedVariants.map((variant) => {
						const variantWithIds = variant as Variant & { _id?: unknown; id?: string };
						const resolvedId = variantWithIds._id ?? variantWithIds.id;
						return {
							_id: resolvedId,
							productId: variant.productId,
							sku: variant.sku,
							price: variant.price,
							stock: variant.stock,
							attributes: variant.attributes,
						};
					}),
				},
			},
		);
	}

}

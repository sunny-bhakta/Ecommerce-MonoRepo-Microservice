import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CategoryDocument, CategoryEntity } from './schemas/category.schema';
import { OptionDefinition, ProductDocument, Product as ProductEntity, Variant as VariantEntity, VariantDocument } from './schemas/product.schema';
import {
  VariantCollection,
  VariantCollectionDocument,
} from './schemas/variant-collection.schema';

type LeanLike<T> = T & { _id?: unknown; id?: string };
type CategoryDoc = CategoryDocument | LeanLike<CategoryEntity> | (Category & { _id?: unknown });
type VariantDoc = VariantDocument | LeanLike<VariantEntity> | (Variant & { _id?: unknown });
type VariantCollectionDoc =
  | VariantCollectionDocument
  | LeanLike<VariantCollection>
  | (VariantCollection & { _id?: unknown });
type ProductDoc = ProductDocument | LeanLike<ProductEntity> | (Product & { _id?: unknown });

export interface Attribute {
  key: string;
  value: string;
}

export interface OptionDefinitionInput {
  name: string;
  values: string[];
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Attribute[];
}

export enum ProductStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  attributes: Attribute[];
  options: OptionDefinition[];
  variants: Variant[];
  vendorId?: string;
  status?: ProductStatus;
}

@Injectable()
export class AppService {
  constructor(
    @InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(ProductEntity.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(VariantCollection.name)
    private readonly variantCollectionModel: Model<VariantCollectionDocument>,
    private readonly config: ConfigService,
  ) {}

  //todo uncomment this when we have a way to configure it
  // private readonly useVariantCollection =
  //   (this.config.get<string>('CATALOG_USE_VARIANT_COLLECTION') ?? '').toLowerCase() === 'true';

  private readonly useVariantCollection = true;
  health() {
    return {
      service: 'catalog',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.create({
      name: dto.name,
      parentId: dto.parentId,
    });
    return this.mapCategory(category);
  }

  async listCategories(): Promise<Category[]> {
    const categories = await this.categoryModel.find().lean({ virtuals: true }).exec();
    return categories.map((item) => this.mapCategory(item));
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const categoryExists = await this.categoryModel.exists({ _id: dto.categoryId });
    if (!categoryExists) {
      throw new BadRequestException(`Category ${dto.categoryId} does not exist`);
    }

    const options = this.normalizeOptionDefinitions(dto.options ?? []);

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
      vendorId: dto.vendorId,
      basePrice: dto.basePrice,
      attributes: dto.attributes ?? [],
      options,
      variants: this.useVariantCollection
        ? []
        : variantsWithKeys.map((variant) => ({
            ...this.stripCombinationKey(variant),
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

    return this.mapProduct(product, this.useVariantCollection ? variantsWithKeys : undefined);
  }

  async listProducts(
    vendorId?: string,
    status?: 'pending' | 'approved' | 'rejected',
  ): Promise<Product[]> {
    const filter: Record<string, unknown> = {};
    if (vendorId) filter.vendorId = vendorId;
    if (status) filter.status = status;

    const products = await this.productModel.find(filter).lean({ virtuals: true }).exec();
    if (!this.useVariantCollection) {
      return products.map((product) => this.mapProduct(product));
    }

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

    return products.map((product) => this.mapProduct(product, byProduct.get(product.id) ?? []));
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).lean({ virtuals: true }).exec();
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    if (!this.useVariantCollection) {
      return this.mapProduct(product);
    }
    const variants = await this.variantCollectionModel
      .find({ productId: id })
      .lean({ virtuals: true })
      .exec();
    return this.mapProduct(product, variants);
  }

  async addVariant(productId: string, dto: CreateVariantDto): Promise<Variant> {
    const product = await this.productModel.findById(productId).lean({ virtuals: true }).exec();
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const options = this.normalizeOptionDefinitions(product.options ?? []);

    if (this.useVariantCollection) {
      const normalizedAttributes = this.normalizeAttributesForOptions(dto.attributes ?? [], options);
      const combinationKey = this.buildCombinationKey(normalizedAttributes);

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
        return this.mapVariant(created);
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          throw new ConflictException('Variant option combination must be unique per product');
        }
        throw error;
      }
    }

    const combinationKeys = new Set<string>(
      (product.variants ?? []).map((v) =>
        this.buildCombinationKey(this.normalizeAttributesForOptions(v.attributes ?? [], options)),
      ),
    );
    const variant = this.buildVariant(productId, dto, options, combinationKeys);

    const updated = await this.productModel
      .findByIdAndUpdate(
        productId,
        { $push: { variants: { ...this.stripCombinationKey(variant), _id: variant.id } } },
        { new: true },
      )
      .lean({ virtuals: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return variant;
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
      return variants.map((variant) => this.mapVariant(variant));
    }

    const product = await this.productModel
      .findById(productId, { variants: 1, options: 1 })
      .lean({ virtuals: true })
      .exec();
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return (product.variants ?? []).map((variant) => this.mapVariant(variant));
  }

  private buildVariant(
    productId: string,
    dto: CreateVariantDto,
    options: OptionDefinition[],
    combinationKeys: Set<string>,
  ): Variant & { combinationKey: string } {
    const normalizedAttributes = this.normalizeAttributesForOptions(dto.attributes ?? [], options);
    const combinationKey = this.buildCombinationKey(normalizedAttributes);
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

  private mapCategory(doc: CategoryDoc): Category {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
    return {
      id: obj.id ?? String(obj._id),
      name: obj.name,
      parentId: obj.parentId,
    };
  }

  private mapVariant(doc: VariantDoc | VariantCollectionDoc): Variant {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
    return {
      id: obj.id ?? String(obj._id),
      productId: obj.productId,
      sku: obj.sku,
      price: obj.price,
      stock: obj.stock,
      attributes: obj.attributes ?? [],
    };
  }

  async updateProductStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean({ virtuals: true })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (!this.useVariantCollection) {
      return this.mapProduct(product);
    }

    const variants = await this.variantCollectionModel
      .find({ productId: id })
      .lean({ virtuals: true })
      .exec();

    return this.mapProduct(product, variants);
  }

  private mapProduct(doc: ProductDoc, variantsOverride?: VariantDoc[] | VariantCollectionDoc[]): Product {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
    const variantsSource = variantsOverride ?? obj.variants ?? [];
    return {
      id: obj.id ?? String(obj._id),
      name: obj.name,
      description: obj.description,
      categoryId: obj.categoryId,
      vendorId: obj.vendorId,
      basePrice: obj.basePrice,
      attributes: obj.attributes ?? [],
      options: obj.options ?? [],
      variants: variantsSource.map((variant: VariantEntity | Variant) => this.mapVariant(variant)),
      status: obj.status,
    };
  }

  private normalizeOptionDefinitions(options: OptionDefinitionInput[]): OptionDefinition[] {
    const seenNames = new Set<string>();
    return options.map((option) => {
      const name = option.name;
      if (seenNames.has(name)) {
        throw new BadRequestException(`Duplicate option name "${name}" on product`);
      }
      seenNames.add(name);

      const uniqueValues = Array.from(new Set(option.values ?? []));
      if (uniqueValues.length === 0) {
        throw new BadRequestException(`Option "${name}" must have at least one value`);
      }
      if (uniqueValues.length !== (option.values ?? []).length) {
        throw new BadRequestException(`Option "${name}" has duplicate values`);
      }

      return { name, values: uniqueValues };
    });
  }

  private normalizeAttributesForOptions(attributes: Attribute[], options: OptionDefinition[]): Attribute[] {
    const attrMap = new Map<string, string>();
    for (const attr of attributes ?? []) {
      if (attrMap.has(attr.key)) {
        throw new BadRequestException(`Duplicate attribute key "${attr.key}" on variant`);
      }
      attrMap.set(attr.key, attr.value);
    }

    if (options.length === 0) {
      const sorted = Array.from(attrMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      return sorted.map(([key, value]) => ({ key, value }));
    }

    const result: Attribute[] = [];
    const optionNames = new Set(options.map((o) => o.name));
    const extraKeys = Array.from(attrMap.keys()).filter((key) => !optionNames.has(key));
    if (extraKeys.length > 0) {
      throw new BadRequestException(
        `Variant contains attributes not defined as options: ${extraKeys.join(', ')}`,
      );
    }

    for (const option of options) {
      const value = attrMap.get(option.name);
      if (!value) {
        throw new BadRequestException(`Variant missing value for option "${option.name}"`);
      }
      if (!option.values.includes(value)) {
        throw new BadRequestException(
          `Variant value "${value}" is not allowed for option "${option.name}"`,
        );
      }
      result.push({ key: option.name, value });
    }

    return result;
  }

  private buildCombinationKey(attributes: Attribute[]): string {
    if (attributes.length === 0) {
      return '__none__';
    }
    return attributes.map((attr) => `${attr.key}:${attr.value}`).join('|');
  }

  private stripCombinationKey(variant: Variant & { combinationKey?: string }): Variant {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { combinationKey: _combinationKey, ...rest } = variant;
    return rest;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && (error as any).code === 11000);
  }
}

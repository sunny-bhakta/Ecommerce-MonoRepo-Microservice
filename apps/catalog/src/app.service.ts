import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CategoryDocument, CategoryEntity } from './schemas/category.schema';
import { ProductDocument, Product as ProductEntity, Variant as VariantEntity, VariantDocument } from './schemas/product.schema';

type LeanLike<T> = T & { _id?: unknown; id?: string };
type CategoryDoc = CategoryDocument | LeanLike<CategoryEntity> | (Category & { _id?: unknown });
type VariantDoc = VariantDocument | LeanLike<VariantEntity> | (Variant & { _id?: unknown });
type ProductDoc = ProductDocument | LeanLike<ProductEntity> | (Product & { _id?: unknown });

export interface Attribute {
  key: string;
  value: string;
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  attributes: Attribute[];
  variants: Variant[];
}

@Injectable()
export class AppService {
  constructor(
    @InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(ProductEntity.name) private readonly productModel: Model<ProductDocument>,
  ) {}

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

    const productId = new Types.ObjectId();
    const variants = (dto.variants ?? []).map((variantDto) => {
      const variant = this.buildVariant(productId.toString(), variantDto);
      return { ...variant, _id: variant.id };
    });

    const product = await this.productModel.create({
      _id: productId,
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
      attributes: dto.attributes ?? [],
      variants,
    });

    return this.mapProduct(product);
  }

  async listProducts(): Promise<Product[]> {
    const products = await this.productModel.find().lean({ virtuals: true }).exec();
    return products.map((product) => this.mapProduct(product));
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).lean({ virtuals: true }).exec();
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return this.mapProduct(product);
  }

  async addVariant(productId: string, dto: CreateVariantDto): Promise<Variant> {
    const variant = this.buildVariant(productId, dto);

    const updated = await this.productModel
      .findByIdAndUpdate(
        productId,
        { $push: { variants: { ...variant, _id: variant.id } } },
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
    const product = await this.productModel
      .findById(productId, { variants: 1 })
      .lean({ virtuals: true })
      .exec();
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return (product.variants ?? []).map((variant) => this.mapVariant(variant));
  }

  private buildVariant(productId: string, dto: CreateVariantDto): Variant {
    return {
      id: new Types.ObjectId().toString(),
      productId,
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock ?? 0,
      attributes: dto.attributes ?? [],
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

  private mapVariant(doc: VariantDoc): Variant {
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

  private mapProduct(doc: ProductDoc): Product {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
    return {
      id: obj.id ?? String(obj._id),
      name: obj.name,
      description: obj.description,
      categoryId: obj.categoryId,
      basePrice: obj.basePrice,
      attributes: obj.attributes ?? [],
      variants: (obj.variants ?? []).map((variant: VariantEntity | Variant) => this.mapVariant(variant)),
    };
  }
}

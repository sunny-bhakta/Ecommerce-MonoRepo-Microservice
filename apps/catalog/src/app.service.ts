import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

interface Attribute {
  key: string;
  value: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

interface Variant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Attribute[];
}

interface Product {
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
  private categories: Category[] = [];
  private products: Product[] = [];

  health() {
    return {
      service: 'catalog',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  createCategory(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      parentId: dto.parentId,
    };
    this.categories.push(category);
    return category;
  }

  listCategories(): Category[] {
    return this.categories;
  }

  createProduct(dto: CreateProductDto): Product {
    const categoryExists = this.categories.some((category) => category.id === dto.categoryId);
    if (!categoryExists) {
      throw new BadRequestException(`Category ${dto.categoryId} does not exist`);
    }

    const product: Product = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
      attributes: dto.attributes ?? [],
      variants: [],
    };

    if (dto.variants?.length) {
      dto.variants.forEach((variantDto) => {
        product.variants.push(this.buildVariant(product.id, variantDto));
      });
    }

    this.products.push(product);
    return product;
  }

  listProducts(): Product[] {
    return this.products;
  }

  getProduct(id: string): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  addVariant(productId: string, dto: CreateVariantDto): Variant {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    const variant = this.buildVariant(productId, dto);
    product.variants.push(variant);
    return variant;
  }

  listVariants(productId: string): Variant[] {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product.variants;
  }

  private buildVariant(productId: string, dto: CreateVariantDto): Variant {
    return {
      id: randomUUID(),
      productId,
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock ?? 0,
      attributes: dto.attributes ?? [],
    };
  }
}

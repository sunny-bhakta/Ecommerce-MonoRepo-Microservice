import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './services/category/dto/create-category.dto';
import { UpdateCategoryDto } from './services/category/dto/update-category.dto';
import { CreateProductDto } from './services/product/dto/create-product.dto';
import { UpdateProductDto } from './services/product/dto/update-product.dto';
import { CreateVariantDto } from './services/product/dto/create-variant.dto';
import { ListProductsQueryDto } from './services/product/dto/list-products-query.dto';
import { ProductListResult } from './services/product/product.types';
import { UpdateVariantDto } from './services/product/dto/update-variant.dto';
import { Category, Product, Variant } from './services/shared';
import { CategoryService } from './services/category/category.service';
import { ProductService } from './services/product';

@Injectable()
export class AppService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
  ) {}

  /** Basic health probe consumed by gateway/infra monitors. */
  health() {
    return {
      service: 'catalog',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a category after validating parent assignments, slug uniqueness,
   * and default ordering metadata. Emits cache + domain events afterwards.
   */
  createCategory(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.createCategory(dto);
  }

  /** Returns all categories as a flat list sorted by sortIndex/name. */
  listCategories(): Promise<Category[]> {
    return this.categoryService.listCategories();
  }

  /**
   * Returns the cached category tree. Falls back to building from Mongo if the
   * cache is unavailable, logging a warning to aid observability.
   */
  listCategoryTree(): Promise<Category[]> {
    return this.categoryService.listCategoryTree();
  }

  /**
   * Applies partial updates to a category, covering re-parenting, slugs,
   * ordering metadata, and localization. Reuses validation helpers.
   */
  updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.categoryService.updateCategory(id, dto);
  }

  /**
   * Creates a product along with its variants (embedded or collection-backed),
   * enforcing category existence, option normalization, and SKU combination uniqueness.
   */
  createProduct(dto: CreateProductDto): Promise<Product> {
    return this.productService.createProduct(dto);
  }

  /** Filters products by vendor/status and resolves variant references when needed. */
  listProducts(query: ListProductsQueryDto): Promise<ProductListResult> {
    return this.productService.listProducts(query);
  }

  /** Loads a single product with variants (embedded or via variant collection). */
  getProduct(id: string): Promise<Product> {
    return this.productService.getProduct(id);
  }

  /** Adds a new variant, honoring option definitions and preventing duplicates. */
  addVariant(productId: string, dto: CreateVariantDto): Promise<Variant> {
    return this.productService.addVariant(productId, dto);
  }

  /** Updates an existing variant regardless of storage strategy. */
  updateVariant(productId: string, variantId: string, dto: UpdateVariantDto): Promise<Variant> {
    return this.productService.updateVariant(productId, variantId, dto);
  }

  /** Removes a variant from a product and returns the deleted payload. */
  deleteVariant(productId: string, variantId: string): Promise<Variant> {
    return this.productService.deleteVariant(productId, variantId);
  }

  /** Lists variants for a product regardless of storage strategy. */
  listVariants(productId: string): Promise<Variant[]> {
    return this.productService.listVariants(productId);
  }

  /** Changes product moderation status and returns the hydrated product. */
  updateProductStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<Product> {
    return this.productService.updateProductStatus(id, status);
  }

  /** Applies partial product updates and revalidates option-driven variant constraints. */
  updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.productService.updateProduct(id, dto);
  }
}

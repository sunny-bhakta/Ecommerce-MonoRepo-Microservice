import { Injectable } from '@nestjs/common';
import { Product, Variant } from '../shared';
import { ProductDoc, VariantCollectionDoc, VariantDoc } from './product.types';

@Injectable()
export class ProductMapper {
  mapVariant(doc: VariantDoc | VariantCollectionDoc): Variant {
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

  mapProduct(doc: ProductDoc, variantsOverride?: Array<VariantDoc | VariantCollectionDoc>): Product {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
    const variantsSource = variantsOverride ?? (obj.variants ?? []);
    return {
      id: obj.id ?? String(obj._id),
      name: obj.name,
      description: obj.description,
      categoryId: obj.categoryId,
      subCategoryId: obj.subCategoryId ?? null,
      vendorId: obj.vendorId,
      basePrice: obj.basePrice,
      attributes: obj.attributes ?? [],
      options: obj.options ?? [],
      variants: variantsSource.map((variant) => this.mapVariant(variant as VariantDoc)),
      status: obj.status,
      categoryBreadcrumb: obj.categoryBreadcrumb ?? [],
    };
  }

  stripCombinationKey(variant: Variant & { combinationKey?: string }): Variant {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { combinationKey: _combinationKey, ...rest } = variant;
    return rest;
  }
}

import { Product as ProductEntity, ProductDocument, Variant as VariantEntity, VariantDocument } from './schemas/product.schema';
import { VariantCollection, VariantCollectionDocument } from './schemas/variant-collection.schema';
import { Product, Variant } from '../shared';

export type LeanLike<T> = T & { _id?: unknown; id?: string };
export type VariantDoc = VariantDocument | LeanLike<VariantEntity> | (Variant & { _id?: unknown });
export type VariantCollectionDoc =
  | VariantCollectionDocument
  | LeanLike<VariantCollection>
  | (VariantCollection & { _id?: unknown });
export type ProductDoc = ProductDocument | LeanLike<ProductEntity> | (Product & { _id?: unknown });

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

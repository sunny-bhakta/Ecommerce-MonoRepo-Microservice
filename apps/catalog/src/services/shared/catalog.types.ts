import { CategoryBreadcrumbNode } from '@app/events';
import { CategoryNode } from '../category/category-tree.utils';
import { OptionDefinition } from '../product/schemas/product.schema';

export interface Attribute {
  key: string;
  value: string;
}

export interface OptionDefinitionInput {
  name: string;
  values: string[];
}

export type Category = CategoryNode;

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
  subCategoryId?: string | null;
  basePrice: number;
  attributes: Attribute[];
  options: OptionDefinition[];
  variants: Variant[];
  vendorId?: string;
  status?: ProductStatus;
  categoryBreadcrumb?: CategoryBreadcrumbNode[];
}

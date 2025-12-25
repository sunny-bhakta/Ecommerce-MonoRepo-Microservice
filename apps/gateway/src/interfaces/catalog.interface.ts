
export interface CatalogCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface CatalogVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { key: string; value: string }[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  vendorId?: string;
  basePrice: number;
  attributes: { key: string; value: string }[];
  variants: CatalogVariant[];
  status?: 'pending' | 'approved' | 'rejected';
}


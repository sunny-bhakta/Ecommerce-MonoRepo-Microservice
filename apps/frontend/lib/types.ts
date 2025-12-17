export type KeyValue = {
  key: string;
  value: string;
};

export type ProductVariant = {
  sku: string;
  price?: number;
  stock?: number;
  attributes?: KeyValue[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  basePrice?: number;
  images?: string[];
  attributes?: KeyValue[];
  variants?: ProductVariant[];
  options?: { name: string; values: string[] }[];
};

export type Category = {
  id: string;
  name: string;
};

export type OrderSummary = {
  id: string;
  status: string;
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
};

export type PaymentSummary = {
  id: string;
  status: string;
  amount?: number;
  currency?: string;
  provider?: string;
};

export type Shipment = {
  id: string;
  trackingNumber?: string;
  carrier?: string;
  status?: string;
  destination?: string;
};

export type UserProfile = {
  id?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  preferences?: {
    language?: string;
    currency?: string;
  };
};

export type CheckoutItem = {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
};


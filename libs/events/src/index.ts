export interface DomainEvent<TPayload = unknown> {
  name: string;
  payload: TPayload;
  occurredAt: string;
}

export enum OrderEventNames {
  ORDER_CREATED = 'order.created',
}

export interface OrderItemSnapshot {
  productId: string;
  quantity: number;
  price: number;
}

export interface OrderCreatedEventPayload {
  orderId: string;
  userId: string;
  total: number;
  currency: string;
  status: string;
  items: OrderItemSnapshot[];
}

export type OrderCreatedEvent = DomainEvent<OrderCreatedEventPayload>;

export interface PaymentCompletedEventPayload {
  orderId: string;
  paymentId: string;
  provider: string;
  amount: number;
  currency: string;
}

export interface PaymentFailedEventPayload {
  orderId: string;
  reason: string;
}

export enum PaymentEventNames {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
}

export enum CatalogEventNames {
  CATEGORY_CHANGED = 'catalog.category.changed',
  PRODUCT_CHANGED = 'catalog.product.changed',
  VARIANT_CHANGED = 'catalog.variant.changed',
}

export interface CategoryChangedEventPayload {
  categoryId: string;
  slug: string;
  name: string;
  parentId?: string;
  sortIndex: number;
  isVisible: boolean;
  path: string[];
  action: 'created' | 'updated' | 'deleted';
}

export interface AttributeSnapshot {
  key: string;
  value: string;
}

export interface OptionDefinitionSnapshot {
  name: string;
  values: string[];
}

export interface CategoryBreadcrumbNode {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSnapshot {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  subCategoryId?: string | null;
  vendorId?: string;
  basePrice: number;
  attributes: AttributeSnapshot[];
  options: OptionDefinitionSnapshot[];
  status?: string;
  variants?: VariantSnapshot[];
  categoryBreadcrumb?: CategoryBreadcrumbNode[];
}

export interface VariantSnapshot {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: AttributeSnapshot[];
}

export interface ProductChangedEventPayload {
  productId: string;
  action: 'created' | 'updated' | 'deleted';
  product?: ProductSnapshot;
}

export interface VariantChangedEventPayload {
  productId: string;
  variantId: string;
  action: 'created' | 'updated' | 'deleted';
  variant?: VariantSnapshot;
}

export type CategoryChangedEvent = DomainEvent<CategoryChangedEventPayload>;
export type ProductChangedEvent = DomainEvent<ProductChangedEventPayload>;
export type VariantChangedEvent = DomainEvent<VariantChangedEventPayload>;


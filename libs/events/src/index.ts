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


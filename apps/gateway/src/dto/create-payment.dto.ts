export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  provider?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}


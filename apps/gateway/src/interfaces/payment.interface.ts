export interface PaymentResponse {
  id: string;
  status: string;
  provider: string;
  amount: number;
  currency: string;
  orderId: string;
}
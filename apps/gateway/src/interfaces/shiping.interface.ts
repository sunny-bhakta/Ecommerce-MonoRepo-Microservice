export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  destination: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
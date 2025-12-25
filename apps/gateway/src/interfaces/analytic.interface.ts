export interface MetricsSummary {
  summary: {
    orders: number;
    payments: number;
    shipments: number;
  };
  gmv: number;
  avgOrderValue: number;
  paymentAttempts: number;
  updatedAt: string;
}
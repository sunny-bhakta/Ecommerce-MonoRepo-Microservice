import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'analytics_metrics', timestamps: true })
export class AnalyticsMetricEntity {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ default: 0 })
  orders: number;

  @Prop({ default: 0 })
  payments: number;

  @Prop({ default: 0 })
  shipments: number;

  @Prop({ default: 0 })
  gmv: number;

  @Prop({ default: 0 })
  paymentsTotal: number;

  @Prop({ default: 0 })
  shipmentsTotal: number;

  @Prop({ default: 0 })
  paymentAttempts: number;
}

export type AnalyticsMetricDocument = HydratedDocument<AnalyticsMetricEntity>;
export const AnalyticsMetricSchema = SchemaFactory.createForClass(AnalyticsMetricEntity);
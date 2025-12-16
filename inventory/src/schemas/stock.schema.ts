import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema({ timestamps: true })
export class Stock {
  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true })
  warehouseId!: string;

  @Prop({ required: true, min: 0, default: 0 })
  onHand!: number;

  @Prop({ required: true, min: 0, default: 0 })
  reserved!: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
StockSchema.index({ sku: 1, warehouseId: 1 }, { unique: true });


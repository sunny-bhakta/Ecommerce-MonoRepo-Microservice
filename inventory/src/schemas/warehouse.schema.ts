import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ required: true })
  name!: string;

  @Prop()
  location?: string;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);


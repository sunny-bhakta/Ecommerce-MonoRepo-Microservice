import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class Attribute {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  value!: string;
}

@Schema({ _id: true, id: false, versionKey: false })
export class Variant {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ type: [{ key: String, value: String }], default: [] })
  attributes!: Attribute[];
}

export type VariantDocument = HydratedDocument<Variant>;

const VariantSchema = SchemaFactory.createForClass(Variant);

VariantSchema.virtual('id').get(function (this: { _id: unknown }) {
  return String(this._id);
});

VariantSchema.set('toJSON', { virtuals: true, versionKey: false });
VariantSchema.set('toObject', { virtuals: true, versionKey: false });

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  basePrice!: number;

  @Prop({ type: [{ key: String, value: String }], default: [] })
  attributes!: Attribute[];

  @Prop({ type: [VariantSchema], default: [] })
  variants!: Variant[];
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('id').get(function (this: { _id: unknown }) {
  return String(this._id);
});

ProductSchema.set('toJSON', { virtuals: true, versionKey: false });
ProductSchema.set('toObject', { virtuals: true, versionKey: false });



import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Attribute } from './product.schema';

@Schema({ timestamps: true, versionKey: false, collection: 'variants' })
export class VariantCollection {
  @Prop({ required: true, index: true })
  productId!: string;

  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ type: [{ key: String, value: String }], default: [] })
  attributes!: Attribute[];

  // Used for uniqueness enforcement on option combinations.
  @Prop({ required: true, select: false })
  combinationKey!: string;
}

export type VariantCollectionDocument = HydratedDocument<VariantCollection>;

export const VariantCollectionSchema = SchemaFactory.createForClass(VariantCollection);

VariantCollectionSchema.index({ productId: 1, combinationKey: 1 }, { unique: true });

VariantCollectionSchema.virtual('id').get(function (this: { _id: unknown }) {
  return String(this._id);
});

VariantCollectionSchema.set('toJSON', { virtuals: true, versionKey: false });
VariantCollectionSchema.set('toObject', { virtuals: true, versionKey: false });


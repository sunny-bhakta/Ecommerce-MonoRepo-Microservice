import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class CategoryEntity {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ default: null })
  parentId?: string | null;

  @Prop({ type: Number, default: 0 })
  sortIndex!: number;

  @Prop({ type: Boolean, default: true })
  isVisible!: boolean;

  @Prop({ type: Map, of: String, default: {} })
  localeNames?: Record<string, string>;
}

export type CategoryDocument = HydratedDocument<CategoryEntity>;

export const CategorySchema = SchemaFactory.createForClass(CategoryEntity);

CategorySchema.virtual('id').get(function (this: { _id: unknown }) {
  return String(this._id);
});

CategorySchema.index({ parentId: 1, sortIndex: 1 });
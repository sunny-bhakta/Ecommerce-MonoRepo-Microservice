import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class CategoryEntity {
  @Prop({ required: true })
  name!: string;

  @Prop()
  parentId?: string;
}

export type CategoryDocument = HydratedDocument<CategoryEntity>;

export const CategorySchema = SchemaFactory.createForClass(CategoryEntity);

CategorySchema.virtual('id').get(function (this: { _id: unknown }) {
  return String(this._id);
});


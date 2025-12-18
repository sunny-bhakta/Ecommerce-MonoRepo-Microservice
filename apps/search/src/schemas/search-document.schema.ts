import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class SearchDocumentEntity {
  @Prop({ required: true, unique: true, index: true })
  documentId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  tagsNormalized!: string[];

  @Prop({ type: String, enum: ['product', 'category', 'general'], default: 'general', index: true })
  type!: 'product' | 'category' | 'general';

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type SearchDocumentDocument = HydratedDocument<SearchDocumentEntity>;

export const SearchDocumentSchema = SchemaFactory.createForClass(SearchDocumentEntity);

SearchDocumentSchema.index({ title: 'text', description: 'text', tags: 'text', tagsNormalized: 'text' });

SearchDocumentSchema.virtual('id').get(function (this: { documentId: string }) {
  return this.documentId;
});

SearchDocumentSchema.set('toJSON', { virtuals: true, versionKey: false });
SearchDocumentSchema.set('toObject', { virtuals: true, versionKey: false });

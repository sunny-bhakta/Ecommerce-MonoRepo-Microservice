import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  targetId!: string;

  @Prop({ required: true, enum: ['product', 'vendor'] })
  targetType!: 'product' | 'vendor';

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop()
  comment?: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @Prop({ default: false })
  flagged!: boolean;

  @Prop()
  flagReason?: string;

  @Prop()
  moderatorNote?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminActionDocument = HydratedDocument<AdminActionEntity>;

@Schema({ collection: 'admin_actions', timestamps: true })
export class AdminActionEntity {
  @Prop({ required: true })
  targetType: string;

  @Prop({ required: true })
  targetId: string;

  @Prop({ required: true })
  actionType: string;

  @Prop({ enum: ['pending', 'in_progress', 'completed', 'rejected'], default: 'pending' })
  status: string;

  @Prop()
  note?: string;

  @Prop()
  resolutionNote?: string;
}

export const AdminActionSchema = SchemaFactory.createForClass(AdminActionEntity);
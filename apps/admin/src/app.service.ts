import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAdminActionDto } from './dto/create-admin-action.dto';
import { UpdateAdminActionDto } from './dto/update-admin-action.dto';
import { AdminActionDocument, AdminActionEntity } from './schemas/admin_actions.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(AdminActionEntity.name)
    private readonly actionModel: Model<AdminActionEntity>,
  ) {}

  async health() {
    const count = await this.actionModel.estimatedDocumentCount().exec();
    return {
      service: 'admin',
      status: 'ok',
      actions: count,
      timestamp: new Date().toISOString(),
    };
  }

  async createAction(dto: CreateAdminActionDto) {
    const created = await this.actionModel.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      actionType: dto.actionType,
      status: 'pending',
      note: dto.note,
    });
    return this.toResponse(created);
  }

  async listActions(status?: string, targetType?: string) {
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (targetType) filters.targetType = targetType;

    const actions = await this.actionModel.find(filters).lean().exec();
    return actions.map(this.toResponse);
  }

  async updateAction(id: string, dto: UpdateAdminActionDto) {
    const updated = await this.actionModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: dto.status,
            resolutionNote: dto.resolutionNote,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Admin action not found');
    }

    return this.toResponse(updated);
  }

  private toResponse(doc: any) {
    const json = 'toJSON' in doc ? doc.toJSON() : doc;
    return {
      id: json._id.toString(),
      targetType: json.targetType,
      targetId: json.targetId,
      actionType: json.actionType,
      status: json.status,
      note: json.note,
      resolutionNote: json.resolutionNote,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
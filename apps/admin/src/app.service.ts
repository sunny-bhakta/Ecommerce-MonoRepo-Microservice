import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateAdminActionDto } from './dto/create-admin-action.dto';
import { UpdateAdminActionDto } from './dto/update-admin-action.dto';

interface AdminAction {
  id: string;
  targetType: CreateAdminActionDto['targetType'];
  targetId: string;
  actionType: CreateAdminActionDto['actionType'];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  note?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AppService {
  private actions: AdminAction[] = [];

  health() {
    return {
      service: 'admin',
      status: 'ok',
      actions: this.actions.length,
      timestamp: new Date().toISOString(),
    };
  }

  createAction(dto: CreateAdminActionDto): AdminAction {
    const now = new Date().toISOString();
    const action: AdminAction = {
      id: randomUUID(),
      targetType: dto.targetType,
      targetId: dto.targetId,
      actionType: dto.actionType,
      status: 'pending',
      note: dto.note,
      createdAt: now,
      updatedAt: now,
    };
    this.actions.push(action);
    return action;
  }

  listActions(status?: AdminAction['status'], targetType?: AdminAction['targetType']) {
    return this.actions.filter((a) => {
      const matchStatus = status ? a.status === status : true;
      const matchType = targetType ? a.targetType === targetType : true;
      return matchStatus && matchType;
    });
  }

  updateAction(id: string, dto: UpdateAdminActionDto): AdminAction {
    const action = this.getAction(id);
    action.status = dto.status;
    action.resolutionNote = dto.resolutionNote;
    action.updatedAt = new Date().toISOString();
    return action;
  }

  private getAction(id: string): AdminAction {
    const found = this.actions.find((a) => a.id === id);
    if (!found) {
      throw new NotFoundException('Admin action not found');
    }
    return found;
  }
}

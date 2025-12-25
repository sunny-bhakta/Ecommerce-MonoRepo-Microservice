import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateAdminActionDto } from '../dto/create-admin-action.dto';
import { UpdateAdminActionDto } from '../dto/update-admin-action.dto';
import { AdminActionGatewayService } from '../services/admin-action.service';

@UseGuards(GatewayAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/actions')
export class AdminActionsController {
  constructor(private readonly adminActionsService: AdminActionGatewayService) {}

  @Post()
  createAdminAction(@Body() dto: CreateAdminActionDto) {
    return this.adminActionsService.createAdminAction(dto);
  }

  @Get()
  listAdminActions(@Query('status') status?: string, @Query('targetType') targetType?: 'user' | 'vendor' | 'catalog' | 'order' | 'payment' | 'review') {
    return this.adminActionsService.listAdminActions(status, targetType);
  }

  @Patch(':id')
  updateAdminAction(@Param('id') id: string, @Body() dto: UpdateAdminActionDto) {
    return this.adminActionsService.updateAdminAction(id, dto);
  }
}
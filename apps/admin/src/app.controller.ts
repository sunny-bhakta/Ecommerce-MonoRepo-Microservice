import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateAdminActionDto } from './dto/create-admin-action.dto';
import { UpdateAdminActionDto } from './dto/update-admin-action.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('admin/actions')
  createAction(@Body() dto: CreateAdminActionDto) {
    return this.appService.createAction(dto);
  }

  @Get('admin/actions')
  listActions(
    @Query('status') status?: 'pending' | 'in_progress' | 'completed' | 'rejected',
    @Query('targetType')
    targetType?: 'user' | 'vendor' | 'catalog' | 'order' | 'payment' | 'review',
  ) {
    return this.appService.listActions(status, targetType);
  }

  @Patch('admin/actions/:id')
  updateAction(@Param('id') id: string, @Body() dto: UpdateAdminActionDto) {
    return this.appService.updateAction(id, dto);
  }
}

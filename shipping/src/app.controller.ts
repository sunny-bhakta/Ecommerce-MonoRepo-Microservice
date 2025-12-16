import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Controller()
export class ShippingController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.appService.createShipment(dto);
  }

  @Get('shipments')
  listShipments(@Query('orderId') orderId?: string) {
    return this.appService.listShipments(orderId);
  }

  @Get('shipments/:id')
  getShipment(@Param('id') id: string) {
    return this.appService.getShipment(id);
  }

  @Patch('shipments/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.appService.updateStatus(id, dto);
  }
}

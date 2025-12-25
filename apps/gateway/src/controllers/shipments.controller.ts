import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { ShipmentGatewayService } from '../services/shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentService: ShipmentGatewayService) {}

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.shipmentService.createShipment(dto);
  }

  @Get()
  listShipments(@Query('orderId') orderId?: string) {
    return this.shipmentService.listShipments(orderId);
  }

  @Get(':id')
  getShipment(@Param('id') id: string) {
    return this.shipmentService.getShipment(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  updateShipmentStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.shipmentService.updateShipmentStatus(id, dto);
  }
}
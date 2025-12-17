import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('orders')
  create(@Body() dto: CreateOrderDto) {
    return this.appService.createOrder(dto);
  }

  @Get('orders')
  list(@Query('userId') userId?: string, @Query('vendorId') vendorId?: string) {
    return this.appService.listOrders(userId, vendorId);
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.appService.getOrder(id);
  }
}

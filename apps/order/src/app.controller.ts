import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.appService.createOrder(dto);
  }

  @Get()
  list(@Query('userId') userId?: string) {
    return this.appService.listOrders(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appService.getOrder(id);
  }
}

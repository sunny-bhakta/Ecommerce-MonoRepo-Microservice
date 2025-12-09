import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.appService.create(dto);
  }

  @Get()
  list(@Query('userId') userId?: string, @Query('orderId') orderId?: string) {
    return this.appService.list(userId, orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appService.get(id);
  }

  @Post(':id/refund')
  requestRefund(@Param('id') id: string, @Body() dto: CreateRefundDto) {
    return this.appService.requestRefund(id, dto);
  }

  @Get(':id/refunds')
  listRefunds(@Param('id') id: string) {
    return this.appService.listRefunds(id);
  }
}

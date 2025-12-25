import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { CheckoutRequestDto } from '../dto/checkout-request.dto';
import { OrdersGatewayService } from '../services/orders.service';

@UseGuards(GatewayAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersGatewayService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.orderService.createOrder(dto, user);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query('userId') userId?: string, @Query('vendorId') vendorId?: string) {
    return this.orderService.listOrders(user, userId, vendorId);
  }

  @Get(':orderId/summary')
  summary(@Param('orderId') orderId: string) {
    return this.orderService.getOrderAggregate(orderId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Get(':orderId/payments')
  payments(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.orderService.listOrderPayments(orderId, user);
  }

  //todo see usecase for these endpoints

  // @Get(':orderId/payments/:paymentId')
  // payment(@Param('paymentId') paymentId: string) {
  //   return this.orderService.getPayment(paymentId);
  // }

  // @Post(':orderId/payments/:paymentId/refunds')
  // refund(@Param('paymentId') paymentId: string, @Body() dto: CreateRefundDto) {
  //   return this.orderService.requestRefund(paymentId, dto);
  // }

  // @Get(':orderId/payments/:paymentId/refunds')
  // refunds(@Param('paymentId') paymentId: string) {
  //   return this.orderService.listRefunds(paymentId);
  // }

  // @Get(':orderId/shipments')
  // shipments(@Param('orderId') orderId: string) {
  //   return this.orderService.listShipments(orderId);
  // }

  @Post('checkout')
  checkout(@Body() dto: CheckoutRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.orderService.checkout(dto, user);
    }
}
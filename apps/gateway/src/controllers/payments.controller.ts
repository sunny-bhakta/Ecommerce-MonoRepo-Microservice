import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { PaymentGatewayService } from '../services/payments.service';

@UseGuards(GatewayAuthGuard)
@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentGatewayService) {}

  @Post('payments')
  createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.createPayment(dto, user);
  }

  @Get('payments')
  listPayments(@CurrentUser() user: AuthenticatedUser, @Query('orderId') orderId?: string, @Query('userId') userId?: string) {
    return this.paymentService.listPayments(user, orderId, userId);
  }

  @Get('payments/:paymentId')
  getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPayment(paymentId);
  }

  @Post('payments/:paymentId/refund')
  refundPayment(@Param('paymentId') paymentId: string, @Body() dto: CreateRefundDto) {
    return this.paymentService.requestRefund(paymentId, dto);
  }

  @Get('payments/:paymentId/refunds')
  listPaymentRefunds(@Param('paymentId') paymentId: string) {
    return this.paymentService.listRefunds(paymentId);
  }
}
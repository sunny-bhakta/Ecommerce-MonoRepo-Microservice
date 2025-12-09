import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { AppService } from './app.service';

@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(private readonly appService: AppService) {}

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(body);
    await this.appService.handleRazorpayWebhook(rawBody, signature, body);
    return { received: true };
  }

  @Post('stripe')
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
    await this.appService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }
}


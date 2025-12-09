import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { AppService } from './app.service';
import { PaymentCompletedEventPayload, PaymentFailedEventPayload } from '@app/events';

@Controller()
export class OrderEventsController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('payment.completed')
  async handlePaymentCompleted(@Payload() payload: PaymentCompletedEventPayload) {
    await this.appService.markOrderPaid(payload);
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() payload: PaymentFailedEventPayload) {
    await this.appService.markOrderFailed(payload);
  }
}


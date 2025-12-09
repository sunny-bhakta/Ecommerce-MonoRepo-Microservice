import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { AppService } from './app.service';
import { OrderCreatedEvent, OrderEventNames } from '@app/events';

@Controller()
export class PaymentEventsController {
  constructor(private readonly appService: AppService) {}

  @EventPattern(OrderEventNames.ORDER_CREATED)
  async handleOrderCreated(@Payload() event: OrderCreatedEvent) {
    await this.appService.handleOrderCreated(event.payload);
  }
}


import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity, OrderStatus } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import {
  OrderCreatedEvent,
  OrderCreatedEventPayload,
  OrderEventNames,
  PaymentCompletedEventPayload,
  PaymentFailedEventPayload,
} from '@app/events';
import { ORDER_EVENTS_CLIENT } from './order.constants';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @Inject(ORDER_EVENTS_CLIENT) private readonly orderEventClient: ClientProxy,
  ) {}

  async health() {
    const count = await this.orderRepository.count();
    return { service: 'order', status: 'ok', orders: count, timestamp: new Date().toISOString() };
  }

  async createOrder(dto: CreateOrderDto): Promise<OrderEntity> {
    const order = this.orderRepository.create({
      userId: dto.userId,
      currency: dto.currency,
      totalAmount: dto.totalAmount,
      status: dto.status ?? OrderStatus.PENDING,
      notes: dto.notes,
      items: dto.items.map((item) =>
        this.orderItemRepository.create({
          productId: item.productId,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
        }),
      ),
    });

    const saved = await this.orderRepository.save(order);
    await this.emitOrderCreatedEvent(saved);
    return saved;
  }

  async listOrders(userId?: string): Promise<OrderEntity[]> {
    if (userId) {
      return this.orderRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    }
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getOrder(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async markOrderPaid(payload: PaymentCompletedEventPayload): Promise<void> {
    await this.orderRepository.update(
      { id: payload.orderId },
      { status: OrderStatus.PAID, paymentId: payload.paymentId },
    );
  }

  async markOrderFailed(payload: PaymentFailedEventPayload): Promise<void> {
    await this.orderRepository.update({ id: payload.orderId }, { status: OrderStatus.FAILED });
  }

  private async emitOrderCreatedEvent(order: OrderEntity): Promise<void> {
    const event: OrderCreatedEvent = {
      name: OrderEventNames.ORDER_CREATED,
      occurredAt: new Date().toISOString(),
      payload: {
        orderId: order.id,
        userId: order.userId,
        total: order.totalAmount,
        currency: order.currency,
        status: order.status,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      } satisfies OrderCreatedEventPayload,
    };

    // This line sends (emits) the 'OrderCreatedEvent' to other services or microservices via the 'orderEventClient'.
    // 'event.name' specifies the type of the event, and 'event' contains all data about the created order.
    // The 'emit' function returns an Observable, so 'lastValueFrom' is used to await its completion.
    await lastValueFrom(this.orderEventClient.emit(event.name, event));
  }
}

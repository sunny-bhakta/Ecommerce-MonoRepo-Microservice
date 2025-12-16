import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { logDomainEvent } from '@app/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

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
    try {
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
      console.log("#0000081111663", saved);
      logDomainEvent(this.logger, {
        action: 'create',
        entity: 'order',
        entityId: saved.id,
        status: 'success',
        detail: { userId: saved.userId, total: saved.totalAmount, currency: saved.currency },
      });
      await this.emitOrderCreatedEvent(saved);
      console.log("#0000081111664 => ");
      return saved;
    } catch (error) {
      logDomainEvent(this.logger, {
        action: 'create',
        entity: 'order',
        status: 'failure',
        detail: { error: (error as Error)?.message },
      });
      throw error;
    }
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
    logDomainEvent(this.logger, {
      action: 'payment',
      entity: 'order',
      entityId: payload.orderId,
      status: 'success',
      detail: { paymentId: payload.paymentId },
    });
  }

  async markOrderFailed(payload: PaymentFailedEventPayload): Promise<void> {
    await this.orderRepository.update({ id: payload.orderId }, { status: OrderStatus.FAILED });
    logDomainEvent(this.logger, {
      action: 'payment',
      entity: 'order',
      entityId: payload.orderId,
      status: 'failure',
      detail: { reason: 'payment_failed' },
    });
  }

  private async emitOrderCreatedEvent(order: OrderEntity): Promise<void> {
    console.log("#00000811119 emitOrderCreatedEvent emitOrderCreatedEvent=> ");
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
    try {
      console.log("#000008111110aa => ");
      let c = await lastValueFrom(this.orderEventClient.emit(event.name, event));
      console.log("#000008111111bbc => ", c);
      logDomainEvent(this.logger, {
        action: 'emit',
        entity: 'order.created',
        entityId: order.id,
        status: 'success',
        detail: { userId: order.userId, total: order.totalAmount },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to emit ORDER_CREATED for order ${order.id}: ${err?.message}`, err?.stack);
      logDomainEvent(this.logger, {
        action: 'emit',
        entity: 'order.created',
        entityId: order.id,
        status: 'failure',
        detail: { error: err?.message },
      });
      throw new Error(`Order ${order.id} created but event publish failed: ${err?.message}`);
    }
  }
}

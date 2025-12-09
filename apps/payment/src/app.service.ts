import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { lastValueFrom } from 'rxjs';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity';
import { PaymentEventLogEntity } from './entities/payment-event-log.entity';
import { PaymentRefundEntity, RefundStatus } from './entities/payment-refund.entity';
import {
  OrderCreatedEventPayload,
  PaymentCompletedEventPayload,
  PaymentEventNames,
  PaymentFailedEventPayload,
  PaymentRefundedEventPayload,
} from '@app/events';
import {
  MAX_PAYMENT_ATTEMPTS,
  PAYMENT_DLQ_QUEUE,
  PAYMENT_EVENTS_CLIENT,
  PAYMENT_RETRY_QUEUE,
} from './payment.constants';
import { RazorpayProvider } from './providers/razorpay.provider';

interface PaymentRetryJobData {
  paymentId: string;
  attempt?: number;
}

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(PaymentEventLogEntity)
    private readonly paymentEventLogRepository: Repository<PaymentEventLogEntity>,
    @InjectRepository(PaymentRefundEntity)
    private readonly paymentRefundRepository: Repository<PaymentRefundEntity>,
    @Inject(PAYMENT_EVENTS_CLIENT)
    private readonly paymentEventsClient: ClientProxy,
    @Inject(PAYMENT_RETRY_QUEUE)
    private readonly paymentRetryQueue: Queue<PaymentRetryJobData>,
    @Inject(PAYMENT_DLQ_QUEUE)
    private readonly paymentDlqQueue: Queue,
    private readonly razorpayProvider: RazorpayProvider,
  ) {}

  async health() {
    const count = await this.paymentRepository.count();
    return { service: 'payment', status: 'ok', payments: count, timestamp: new Date().toISOString() };
  }

  async create(dto: CreatePaymentDto): Promise<PaymentEntity> {
    const payment = this.paymentRepository.create({
      ...dto,
      status: PaymentStatus.PROCESSING,
      metadata: { initiatedVia: 'http', provider: dto.provider },
    });
    const saved = await this.paymentRepository.save(payment);
    await this.enqueuePaymentProcessing(saved.id);
    return this.paymentRepository.findOneByOrFail({ id: saved.id });
  }

  async list(userId?: string, orderId?: string): Promise<PaymentEntity[]> {
    const where: FindOptionsWhere<PaymentEntity> = {};
    if (userId) {
      where.userId = userId;
    }
    if (orderId) {
      where.orderId = orderId;
    }
    return this.paymentRepository.find({
      where: Object.keys(where).length ? where : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async get(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async handleOrderCreated(payload: OrderCreatedEventPayload): Promise<void> {
    const existing = await this.paymentRepository.findOne({ where: { orderId: payload.orderId } });
    if (existing) {
      return;
    }
    const payment = this.paymentRepository.create({
      orderId: payload.orderId,
      userId: payload.userId,
      amount: payload.total,
      currency: payload.currency,
      status: PaymentStatus.PROCESSING,
      metadata: { source: 'order.event', status: payload.status },
    });
    const saved = await this.paymentRepository.save(payment);
    await this.enqueuePaymentProcessing(saved.id);
  }

  async processPaymentJob(jobData: PaymentRetryJobData): Promise<void> {
    await this.processPayment(jobData.paymentId, jobData.attempt ?? 1);
  }

  private async enqueuePaymentProcessing(paymentId: string, attempt = 1, delayMs = 0): Promise<void> {
    await this.paymentRetryQueue.add(
      'process-payment',
      { paymentId, attempt },
      {
        delay: delayMs,
        removeOnComplete: true,
      },
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const base = 10_000;
    const delay = base * 2 ** (attempt - 1);
    return Math.min(delay, 5 * 60 * 1000);
  }

  private async processPayment(paymentId: string, attempt: number): Promise<void> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      return;
    }

    try {
      const result = await this.chargeViaRazorpay(payment);
      await this.paymentRepository.update(
        { id: paymentId },
        { status: PaymentStatus.PENDING, failureReason: null, gatewayOrderId: result.id },
      );
      const updated = await this.paymentRepository.findOneByOrFail({ id: paymentId });
      await this.recordProviderEvent(
        'razorpay',
        'order.created',
        {
          providerOrderId: result.id,
          paymentId: paymentId,
          providerStatus: result.status,
        },
        updated,
      );
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Razorpay order creation failed';
      await this.recordProviderEvent(
        'razorpay',
        'order.create.failed',
        {
          paymentId,
          attempt,
          reason: failureReason,
        },
        payment,
      );

      if (attempt >= MAX_PAYMENT_ATTEMPTS) {
        await this.paymentRepository.update(
          { id: paymentId },
          { status: PaymentStatus.FAILED, failureReason },
        );
        await this.paymentDlqQueue.add(
          'payment-order-failed',
          {
            paymentId,
            attempt,
            reason: failureReason,
          },
          { removeOnComplete: true },
        );
        const updated = await this.paymentRepository.findOne({ where: { id: paymentId } });
        if (updated) {
          await this.emitPaymentFailedEvent(updated, failureReason);
        }
      } else {
        const delayMs = this.calculateRetryDelay(attempt);
        await this.enqueuePaymentProcessing(paymentId, attempt + 1, delayMs);
      }
    }
  }

  private async chargeViaRazorpay(payment: PaymentEntity) {
    return this.razorpayProvider.createOrder({
      amount: payment.amount,
      currency: payment.currency,
      receipt: payment.orderId,
      notes: {
        orderId: payment.orderId,
        userId: payment.userId,
      },
    });
  }

  private async emitPaymentCompletedEvent(payment: PaymentEntity): Promise<void> {
    const event: PaymentCompletedEventPayload = {
      orderId: payment.orderId,
      paymentId: payment.id,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
    };
    await lastValueFrom(this.paymentEventsClient.emit(PaymentEventNames.PAYMENT_COMPLETED, event));
  }

  private async emitPaymentFailedEvent(payment: PaymentEntity, reason: string): Promise<void> {
    const event: PaymentFailedEventPayload = {
      orderId: payment.orderId,
      reason,
    };
    await lastValueFrom(this.paymentEventsClient.emit(PaymentEventNames.PAYMENT_FAILED, event));
  }

  private async recordProviderEvent(
    provider: string,
    eventType: string,
    payload: unknown,
    payment?: PaymentEntity,
  ) {
    await this.paymentEventLogRepository.save({
      provider,
      eventType,
      paymentId: payment?.id,
      orderId: payment?.orderId,
      payload: JSON.stringify(payload),
    });
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined, payload: any) {
    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature header');
    }
    const isValid = this.razorpayProvider.validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid Razorpay signature');
    }

    const eventType = payload?.event;

    const paymentEntityPayload = payload?.payload?.payment?.entity;
    if (!paymentEntityPayload) {
      return;
    }

    const providerOrderId: string | undefined = paymentEntityPayload.order_id;
    const providerPaymentId: string | undefined = paymentEntityPayload.id;

    if (!providerOrderId) {
      return;
    }

    const payment = providerOrderId
      ? await this.paymentRepository.findOne({ where: { gatewayOrderId: providerOrderId } })
      : null;

    await this.recordProviderEvent('razorpay', eventType ?? 'unknown', payload, payment ?? undefined);

    if (!payment) {
      return;
    }

    if (eventType === 'payment.captured') {
      await this.paymentRepository.update(
        { id: payment.id },
        {
          status: PaymentStatus.SUCCEEDED,
          gatewayPaymentId: providerPaymentId,
          failureReason: null,
        },
      );
      const updated = await this.paymentRepository.findOneByOrFail({ id: payment.id });
      await this.emitPaymentCompletedEvent(updated);
    } else if (eventType === 'payment.failed') {
      const failureReason =
        paymentEntityPayload.error_description ||
        paymentEntityPayload.error_reason ||
        payload?.payload?.payment?.entity?.error_description ||
        'Razorpay payment failed';

      await this.paymentRepository.update(
        { id: payment.id },
        {
          status: PaymentStatus.FAILED,
          gatewayPaymentId: providerPaymentId ?? payment.gatewayPaymentId,
          failureReason,
        },
      );
      const updated = await this.paymentRepository.findOneByOrFail({ id: payment.id });
      await this.emitPaymentFailedEvent(updated, failureReason);
    }
  }
}

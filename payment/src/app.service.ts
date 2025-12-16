import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { lastValueFrom } from 'rxjs';
import Stripe from 'stripe';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { HttpService } from '@nestjs/axios';
import { CreateRefundDto } from './dto/create-refund.dto';
import { PaymentEntity, PaymentProvider, PaymentStatus } from './entities/payment.entity';
import { PaymentEventLogEntity } from './entities/payment-event-log.entity';
import { PaymentRefundEntity, RefundStatus } from './entities/payment-refund.entity';
import {
  OrderCreatedEventPayload,
  PaymentCompletedEventPayload,
  PaymentEventNames,
  PaymentFailedEventPayload,
} from '@app/events';
import {
  MAX_PAYMENT_ATTEMPTS,
  PAYMENT_DLQ_QUEUE,
  PAYMENT_EVENTS_CLIENT,
  PAYMENT_RETRY_QUEUE,
} from './payment.constants';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';

interface PaymentRetryJobData {
  paymentId: string;
  attempt?: number;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
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
    private readonly stripeProvider: StripeProvider,
  ) {
    this.paymentRetryQueue.on('error', (err) => {
      this.logger.error('Payment retry queue connection error', err instanceof Error ? err.stack : undefined);
    });
  }

  async health() {
    const count = await this.paymentRepository.count();
    return { service: 'payment', status: 'ok', payments: count, timestamp: new Date().toISOString() };
  }

  async create(dto: CreatePaymentDto): Promise<PaymentEntity> {
    await this.assertOrderExists(dto.orderId, dto.userId);
    const existing = await this.paymentRepository.findOne({ where: { orderId: dto.orderId } });
    if (existing) {
      if (existing.userId !== dto.userId) {
        throw new ConflictException('Payment already exists for this order');
      }
      this.logger.debug('Payment already exists for order; returning existing', { orderId: dto.orderId });
      return existing;
    }

    const provider = dto.provider ?? this.getDefaultProvider();
    this.logger.log(`Creating payment`, { provider, orderId: dto.orderId, userId: dto.userId });
    const payment = this.paymentRepository.create({
      ...dto,
      status: PaymentStatus.PROCESSING,
      provider,
      metadata: { initiatedVia: 'http', provider: dto.provider },
    });

    try {
      const saved = await this.paymentRepository.save(payment);
      await this.enqueuePaymentProcessing(saved.id);
      this.logger.log(`Payment created and enqueued`, { paymentId: saved.id });
      return this.paymentRepository.findOneByOrFail({ id: saved.id });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.paymentRepository.findOne({ where: { orderId: dto.orderId } });
        if (duplicate) {
          if (duplicate.userId !== dto.userId) {
            throw new ConflictException('Payment already exists for this order');
          }
          this.logger.debug('Payment already exists for order after concurrent create; returning existing', {
            orderId: dto.orderId,
          });
          return duplicate;
        }
      }
      throw error;
    }
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
    this.logger.log('Received order.created event', { orderId: payload.orderId, userId: payload.userId });
    const existing = await this.paymentRepository.findOne({ where: { orderId: payload.orderId } });
    if (existing) {
      this.logger.debug('Payment already exists for order; skipping creation', { orderId: payload.orderId });
      return;
    }
    const payment = this.paymentRepository.create({
      orderId: payload.orderId,
      userId: payload.userId,
      amount: payload.total,
      currency: payload.currency,
      status: PaymentStatus.PROCESSING,
      provider: this.getDefaultProvider(),
      metadata: { source: 'order.event', status: payload.status },
    });
    try {
      const saved = await this.paymentRepository.save(payment);
      this.logger.log('Payment created from order event; enqueueing processing', { paymentId: saved.id });
      await this.enqueuePaymentProcessing(saved.id);
      this.logger.debug('Payment enqueued from order event', { paymentId: saved.id });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.logger.debug('Payment already exists for order; event create skipped after unique constraint', {
          orderId: payload.orderId,
        });
        return;
      }
      throw error;
    }
  }

  private getDefaultProvider(): PaymentProvider {
    return this.config.get<PaymentProvider>('PAYMENT_PROVIDER') ?? PaymentProvider.RAZORPAY;
  }

  private async assertOrderExists(orderId: string, userId: string): Promise<void> {
    const orderServiceUrl = this.config.get<string>('ORDER_SERVICE_URL') ?? 'http://localhost:3060';
    try {
      const response = await this.http.axiosRef.get(`${orderServiceUrl}/order/orders/${orderId}`, {
        headers: { 'x-user-id': userId },
        validateStatus: (status) => status < 500,
      });

      if (response.status === 404) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(`Not allowed to use order ${orderId}`);
      }
      if (response.status >= 300) {
        throw new BadRequestException(`Order lookup failed: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Order verification failed', error instanceof Error ? error.stack : undefined, {
        orderId,
        userId,
      });
      if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to verify order for payment');
    }
  }

  async processPaymentJob(jobData: PaymentRetryJobData): Promise<void> {
    await this.processPayment(jobData.paymentId, jobData.attempt ?? 1);
  }

  private async enqueuePaymentProcessing(paymentId: string, attempt = 1, delayMs = 0): Promise<void> {
    try {
      // Ensure Redis connection is ready; otherwise socket-level errors can
      // terminate before reaching this try/catch.
      await this.paymentRetryQueue.waitUntilReady();
      await this.paymentRetryQueue.add(
        'process-payment',
        { paymentId, attempt },
        {
          delay: delayMs,
          removeOnComplete: true,
        },
      );
      this.logger.debug('Enqueued payment processing', { paymentId, attempt, delayMs });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enqueue payment processing job';
      this.logger.error(`Enqueue payment processing failed: ${message}`, error instanceof Error ? error.stack : undefined, {
        paymentId,
        attempt,
        delayMs,
      });
      throw new Error(`Enqueue payment processing failed for payment ${paymentId}: ${message}`);
    }
  }

  private calculateRetryDelay(attempt: number): number {
    const base = 10_000;
    const delay = base * 2 ** (attempt - 1);
    return Math.min(delay, 5 * 60 * 1000);
  }

  private async processPayment(paymentId: string, attempt: number): Promise<void> {
    this.logger.debug('Processing payment start', { paymentId, attempt });
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      this.logger.warn('Payment not found when processing', { paymentId, attempt });
      return;
    }

    if (payment.provider === PaymentProvider.RAZORPAY) {
      this.logger.debug('Routing payment to Razorpay', { paymentId, attempt });
      await this.processRazorpayPayment(payment, attempt);
      return;
    }

    if (payment.provider === PaymentProvider.STRIPE) {
      this.logger.debug('Routing payment to Stripe', { paymentId, attempt });
      await this.processStripePayment(payment, attempt);
      return;
    }

    const failureReason = `Unsupported payment provider: ${payment.provider}`;
    await this.recordProviderEvent('payment', 'provider.unsupported', { paymentId, provider: payment.provider }, payment);
    await this.handlePaymentFailure(payment, failureReason, attempt);
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

  private async chargeViaStripe(payment: PaymentEntity) {
    return this.stripeProvider.createPaymentIntent({
      amount: payment.amount,
      currency: payment.currency,
      description: `Order ${payment.orderId}`,
      metadata: {
        orderId: payment.orderId,
        userId: payment.userId,
      },
    });
  }

  private async processRazorpayPayment(payment: PaymentEntity, attempt: number): Promise<void> {
    try {
      this.logger.debug('Creating Razorpay order', { paymentId: payment.id, attempt });
      const result = await this.chargeViaRazorpay(payment);
      await this.paymentRepository.update(
        { id: payment.id },
        { status: PaymentStatus.PENDING, failureReason: null, gatewayOrderId: result.id },
      );
      const updated = await this.paymentRepository.findOneByOrFail({ id: payment.id });
      await this.recordProviderEvent(
        'razorpay',
        'order.created',
        {
          providerOrderId: result.id,
          paymentId: payment.id,
          providerStatus: result.status,
        },
        updated,
      );
      this.logger.log('Razorpay order created', { paymentId: payment.id, providerOrderId: result.id });
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Razorpay order creation failed';
      this.logger.error('Razorpay order creation failed', error instanceof Error ? error.stack : undefined, {
        paymentId: payment.id,
        attempt,
      });
      await this.recordProviderEvent(
        'razorpay',
        'order.create.failed',
        {
          paymentId: payment.id,
          attempt,
          reason: failureReason,
        },
        payment,
      );
      await this.handlePaymentFailure(payment, failureReason, attempt);
    }
  }

  private async processStripePayment(payment: PaymentEntity, attempt: number): Promise<void> {
    try {
      this.logger.debug('Creating Stripe payment intent', { paymentId: payment.id, attempt });
      const result = await this.chargeViaStripe(payment);
      const stripeClientSecret = result.clientSecret ?? undefined;
      const stripeMetadata: Record<string, unknown> | null = {
        ...(payment.metadata ?? {}),
        stripeClientSecret,
      };
      await this.paymentRepository.update(
        { id: payment.id },
        {
          status: PaymentStatus.PENDING,
          failureReason: null,
          gatewayPaymentId: result.id,
          metadata: stripeMetadata as any,
        },
      );
      const updated = await this.paymentRepository.findOneByOrFail({ id: payment.id });
      await this.recordProviderEvent(
        'stripe',
        'payment_intent.created',
        {
          providerPaymentId: result.id,
          paymentId: payment.id,
          providerStatus: result.status,
        },
        updated,
      );
      this.logger.log('Stripe payment intent created', { paymentId: payment.id, providerPaymentId: result.id });
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Stripe payment intent creation failed';
      this.logger.error('Stripe payment intent creation failed', error instanceof Error ? error.stack : undefined, {
        paymentId: payment.id,
        attempt,
      });
      try {
      await this.recordProviderEvent(
        'stripe',
        'payment_intent.create.failed',
        {
          paymentId: payment.id,
          attempt,
          reason: failureReason,
        },
        payment,
      );
        await this.handlePaymentFailure(payment, failureReason, attempt);
      } catch (error) {
        this.logger.error('Stripe failure handling error', error instanceof Error ? error.stack : undefined, {
          paymentId: payment.id,
          attempt,
        });
      }
    }
  }

  private async handlePaymentFailure(payment: PaymentEntity, failureReason: string, attempt: number): Promise<void> {
    if (attempt >= MAX_PAYMENT_ATTEMPTS) {
      await this.paymentRepository.update(
        { id: payment.id },
        { status: PaymentStatus.FAILED, failureReason },
      );
      this.logger.warn('Payment marked failed after max attempts', { paymentId: payment.id, attempt, failureReason });
      await this.paymentDlqQueue.add(
        'payment-order-failed',
        {
          paymentId: payment.id,
          attempt,
          reason: failureReason,
        },
        { removeOnComplete: true },
      );
      const updated = await this.paymentRepository.findOne({ where: { id: payment.id } });
      if (updated) {
        await this.emitPaymentFailedEvent(updated, failureReason);
      }
    } else {
      const delayMs = this.calculateRetryDelay(attempt);
      this.logger.debug('Re-enqueueing payment after failure', { paymentId: payment.id, attempt, delayMs, failureReason });
      await this.enqueuePaymentProcessing(payment.id, attempt + 1, delayMs);
    }
  }

  private async emitPaymentCompletedEvent(payment: PaymentEntity): Promise<void> {
    this.logger.log('Emitting payment.completed event', { paymentId: payment.id, orderId: payment.orderId });
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

  async requestRefund(paymentId: string, dto: CreateRefundDto): Promise<PaymentRefundEntity> {
    this.logger.log('Refund requested', { paymentId, amount: dto.amount, reason: dto.reason });
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    const amount = dto.amount ?? payment.amount;
    if (!amount || amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    if (!payment.gatewayPaymentId) {
      throw new BadRequestException('Payment does not have a provider payment id to refund');
    }

    let providerRefundId: string | undefined;
    let providerStatus: string | null | undefined;

    if (payment.provider === PaymentProvider.RAZORPAY) {
      const result = await this.razorpayProvider.createRefund({
        paymentId: payment.gatewayPaymentId,
        amount,
        currency: payment.currency,
        reason: dto.reason ?? null,
        notes: {
          orderId: payment.orderId,
          paymentId: payment.id,
        },
      });
      providerRefundId = result.id;
      providerStatus = result.status;
    } else if (payment.provider === PaymentProvider.STRIPE) {
      const result = await this.stripeProvider.refund({
        paymentIntentId: payment.gatewayPaymentId,
        amount,
        reason: dto.reason,
      });
      providerRefundId = result.id;
      providerStatus = result.status;
    } else {
      throw new BadRequestException(`Refund not supported for provider ${payment.provider}`);
    }

    const refund = this.paymentRefundRepository.create({
      payment,
      paymentId: payment.id,
      amount,
      currency: payment.currency,
      reason: dto.reason ?? null,
      gatewayRefundId: providerRefundId ?? null,
      status: this.mapProviderRefundStatus(providerStatus),
      metadata: { providerStatus },
    });

    this.logger.log('Refund recorded', {
      paymentId: payment.id,
      refundAmount: amount,
      gatewayRefundId: providerRefundId,
      providerStatus,
    });
    return this.paymentRefundRepository.save(refund);
  }

  async listRefunds(paymentId: string): Promise<PaymentRefundEntity[]> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return this.paymentRefundRepository.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
    });
  }

  private mapProviderRefundStatus(providerStatus?: string | null): RefundStatus {
    if (!providerStatus) {
      return RefundStatus.PROCESSING;
    }

    const normalized = providerStatus.toLowerCase();
    if (['succeeded', 'success', 'processed', 'completed', 'paid'].includes(normalized)) {
      return RefundStatus.COMPLETED;
    }
    if (['failed', 'canceled', 'cancelled', 'declined'].includes(normalized)) {
      return RefundStatus.FAILED;
    }
    return RefundStatus.PROCESSING;
  }

  private isUniqueViolation(error: unknown): boolean {
    const code = (error as any)?.code;
    if (code === '23505' || code === 'SQLITE_CONSTRAINT' || code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return true;
    }
    const message = (error as any)?.message as string | undefined;
    return typeof message === 'string' && message.toLowerCase().includes('unique constraint');
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined, payload: any) {
    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature header');
    }
    this.logger.log('Received Razorpay webhook', { signaturePresent: !!signature });
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
      this.logger.warn('Razorpay webhook could not find payment', { providerOrderId });
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
      this.logger.log('Razorpay webhook marked payment succeeded', { paymentId: payment.id, providerPaymentId });
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
      this.logger.warn('Razorpay webhook marked payment failed', { paymentId: payment.id, providerPaymentId, failureReason });
    }
  }

  async handleStripeWebhook(rawBody: Buffer | string, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeProvider.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    const eventType = event?.type ?? 'unknown';
    const paymentIntent = event?.data?.object as Stripe.PaymentIntent | undefined;
    const providerPaymentId = paymentIntent?.id;
    this.logger.log('Received Stripe webhook', { eventType, providerPaymentId });

    const payment = providerPaymentId
      ? await this.paymentRepository.findOne({ where: { gatewayPaymentId: providerPaymentId } })
      : null;

    await this.recordProviderEvent('stripe', eventType, event.data?.object ?? {}, payment ?? undefined);

    if (!payment || !paymentIntent) {
      this.logger.warn('Stripe webhook could not find payment', { providerPaymentId, eventType });
      return;
    }

    if (eventType === 'payment_intent.succeeded') {
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
      this.logger.log('Stripe webhook marked payment succeeded', { paymentId: payment.id, providerPaymentId });
    } else if (eventType === 'payment_intent.payment_failed') {
      const failureReason = paymentIntent.last_payment_error?.message ?? 'Stripe payment failed';
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
      this.logger.warn('Stripe webhook marked payment failed', { paymentId: payment.id, providerPaymentId, failureReason });
    }
  }
}

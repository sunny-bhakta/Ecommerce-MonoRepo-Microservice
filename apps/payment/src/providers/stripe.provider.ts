import Stripe from 'stripe';

export interface StripeConfig {
  apiKey: string;
  webhookSecret: string;
}

export interface StripePaymentIntentInput {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentResult {
  id: string;
  status: Stripe.PaymentIntent.Status;
  clientSecret?: string | null;
}

export interface StripeRefundInput {
  paymentIntentId: string;
  amount: number;
  reason?: string;
}

export interface StripeRefundResult {
  id: string;
  status: Stripe.Refund['status'];
  amount: number;
  currency: string | null;
}

export class StripeProvider {
  private readonly client: Stripe;
  private readonly webhookSecret: string;

  constructor(config: StripeConfig) {
    this.client = new Stripe(config.apiKey, { apiVersion: '2024-06-20' });
    this.webhookSecret = config.webhookSecret;
  }

  async createPaymentIntent(input: StripePaymentIntentInput): Promise<StripePaymentIntentResult> {
    const intent = await this.client.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      description: input.description,
      metadata: input.metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      id: intent.id,
      status: intent.status,
      clientSecret: intent.client_secret,
    };
  }

  constructWebhookEvent(payload: Buffer | string, signature: string) {
    const rawPayload = typeof payload === 'string' ? payload : payload;
    return this.client.webhooks.constructEvent(rawPayload, signature, this.webhookSecret);
  }

  async refund(input: StripeRefundInput): Promise<StripeRefundResult> {
    const refund = await this.client.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: Math.round(input.amount * 100),
      reason: input.reason as Stripe.RefundCreateParams.Reason | undefined,
    });

    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      currency: refund.currency,
    };
  }
}



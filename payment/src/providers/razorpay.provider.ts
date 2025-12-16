import type Razorpay from 'razorpay';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export interface RazorpayChargeInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string | number>;
}

export interface RazorpayChargeResult {
  id: string;
  status: string;
}

export interface RazorpayRefundInput {
  paymentId: string;
  amount: number;
  currency: string;
  reason?: string | null;
  notes?: Record<string, string | number | null>;
}

export interface RazorpayRefundResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

type RazorpayCtor = new (args: { key_id: string; key_secret: string }) => Razorpay;
type RazorpayStatic = { validateWebhookSignature?: (payload: string, signature: string, secret: string) => boolean };

// Handle both CJS and ESM shapes of the SDK and avoid undefined imports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const razorpayModule = require('razorpay') as { default?: RazorpayCtor } & RazorpayStatic & RazorpayCtor;
const RazorpayCtor = (razorpayModule.default ?? (razorpayModule as unknown as RazorpayCtor)) as RazorpayCtor;
const validateWebhookSignatureFn =
  (razorpayModule as RazorpayStatic).validateWebhookSignature ??
  ((RazorpayCtor as unknown as RazorpayStatic).validateWebhookSignature ?? null);

export class RazorpayProvider {
  private readonly client: Razorpay;
  private readonly keySecret: string;

  constructor(config: RazorpayConfig) {
    this.keySecret = config.keySecret;
    this.client = new RazorpayCtor({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }

  async createOrder(input: RazorpayChargeInput): Promise<RazorpayChargeResult> {
    const order = await this.client.orders.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });
    return { id: order.id, status: order.status };
  }

  async createRefund(input: RazorpayRefundInput): Promise<RazorpayRefundResult> {
    const refundNotes =
      input.reason !== undefined || input.notes
        ? {
            ...(input.notes ?? {}),
            ...(input.reason !== undefined ? { reason: input.reason ?? null } : {}),
          }
        : undefined;

    const refund = await this.client.payments.refund(input.paymentId, {
      amount: Math.round(input.amount * 100),
      notes: refundNotes,
    });
    return {
      id: refund.id,
      status: refund.status,
      amount: (refund.amount ?? 0) / 100,
      currency: refund.currency ?? input.currency,
    };
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    return validateWebhookSignatureFn ? validateWebhookSignatureFn(payload, signature, this.keySecret) : false;
  }
}


import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRefundEntity } from './payment-refund.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
  CASHFREE = 'cashfree',
}

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  orderId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'real' })
  amount!: number;

  @Column({ type: 'text' })
  currency!: string;

  @Column({ type: 'text', default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  gatewayOrderId?: string | null;

  @Column({ type: 'text', nullable: true })
  gatewayPaymentId?: string | null;

  @Column({ type: 'text', default: PaymentProvider.STRIPE })
  provider!: PaymentProvider;

  @Column({ type: 'text', nullable: true })
  failureReason?: string | null;

  @OneToMany(() => PaymentRefundEntity, (refund) => refund.payment, {
    cascade: true,
  })
  refunds?: PaymentRefundEntity[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


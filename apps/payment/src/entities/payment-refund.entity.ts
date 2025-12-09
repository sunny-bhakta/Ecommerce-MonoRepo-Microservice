import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentEntity } from './payment.entity';

export enum RefundStatus {
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'payment_refunds' })
export class PaymentRefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.refunds, {
    onDelete: 'CASCADE',
  })
  payment!: PaymentEntity;

  @Column()
  paymentId!: string;

  @Column({ type: 'real' })
  amount!: number;

  @Column({ type: 'text' })
  currency!: string;

  @Column({ type: 'text', default: RefundStatus.INITIATED })
  status!: RefundStatus;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'text', nullable: true })
  gatewayRefundId?: string | null;

  @Column({ type: 'text', nullable: true })
  source?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderItemEntity } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  FULFILLED = 'fulfilled',
}

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'text' })
  currency!: string;

  @Column({ type: 'real' })
  totalAmount!: number;

  @Column({ type: 'text', default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'text', nullable: true })
  paymentId?: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


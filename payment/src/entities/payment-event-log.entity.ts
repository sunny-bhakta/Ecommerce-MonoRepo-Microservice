import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'payment_event_logs' })
export class PaymentEventLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  eventType!: string;

  @Column({ type: 'text', nullable: true })
  paymentId?: string | null;

  @Column({ type: 'text', nullable: true })
  orderId?: string | null;

  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn()
  createdAt!: Date;
}


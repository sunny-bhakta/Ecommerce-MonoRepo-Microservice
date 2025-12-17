import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_GENERATED = 'label_generated',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity({ name: 'shipments' })
export class ShipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  orderId!: string;

  @Column({ type: 'text' })
  carrier!: string;

  @Column({ type: 'text', nullable: true })
  trackingNumber?: string | null;

  @Column({ type: 'text' })
  destination!: string;

  @Column({ type: 'text', default: ShipmentStatus.PENDING })
  status!: ShipmentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


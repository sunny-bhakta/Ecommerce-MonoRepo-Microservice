import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity({ name: 'vendors' })
export class VendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index('idx_vendors_email', { unique: true })
  @Column({ type: 'text', unique: true })
  email!: string;

  @Index('idx_vendors_company_name')
  @Column({ type: 'text' })
  companyName!: string;

  @Column({ type: 'text', nullable: true })
  gstNumber?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'text', default: KycStatus.PENDING })
  kycStatus!: KycStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


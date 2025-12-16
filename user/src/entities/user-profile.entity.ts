import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_user_profiles_email', { unique: true })
  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  fullName?: string | null;

  @Column({ type: 'text', nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  addresses?: UserAddress[];

  @Column({ type: 'simple-json', nullable: true })
  preferences?: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export interface UserAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
}



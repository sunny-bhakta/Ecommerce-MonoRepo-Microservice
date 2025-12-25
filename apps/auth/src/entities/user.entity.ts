import { UserRole } from '@app/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_users_email', { unique: true })
  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  fullName?: string | null;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'simple-array', default: UserRole.CUSTOMER })
  roles!: UserRole[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}



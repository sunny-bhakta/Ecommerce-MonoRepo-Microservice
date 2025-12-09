import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAdminActionDto {
  @IsIn(['user', 'vendor', 'catalog', 'order', 'payment', 'review'])
  targetType!:
    | 'user'
    | 'vendor'
    | 'catalog'
    | 'order'
    | 'payment'
    | 'review';

  @IsString()
  targetId!: string;

  @IsIn(['review_moderation', 'refund', 'vendor_approval', 'order_investigation'])
  actionType!: 'review_moderation' | 'refund' | 'vendor_approval' | 'order_investigation';

  @IsOptional()
  @IsString()
  note?: string;
}


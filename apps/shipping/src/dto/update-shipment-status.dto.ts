import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateShipmentStatusDto {
  @IsIn(['pending', 'label_generated', 'in_transit', 'delivered', 'failed'])
  status!: 'pending' | 'label_generated' | 'in_transit' | 'delivered' | 'failed';

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}


import { IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  orderId!: string;

  @IsString()
  carrier!: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsString()
  destination!: string;
}


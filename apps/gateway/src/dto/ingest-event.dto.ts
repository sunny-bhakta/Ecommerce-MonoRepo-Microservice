import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestEventDto {
  @IsIn(['order', 'payment', 'shipment'])
  type!: 'order' | 'payment' | 'shipment';

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;
}


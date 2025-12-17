import { IsIn, IsOptional, IsString } from 'class-validator';

import { ShipmentStatus } from '../entities/shipment.entity';

export class UpdateShipmentStatusDto {
  @IsIn(Object.values(ShipmentStatus))
  status!: ShipmentStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}


import { IsNumber, IsString, Min } from 'class-validator';

export class AdjustmentDto {
  @IsString()
  sku!: string;

  @IsString()
  warehouseId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}


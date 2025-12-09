import { IsNumber, IsString, Min } from 'class-validator';

export class UpsertStockDto {
  @IsString()
  sku!: string;

  @IsString()
  warehouseId!: string;

  @IsNumber()
  @Min(0)
  onHand!: number;
}


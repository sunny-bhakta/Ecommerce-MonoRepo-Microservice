import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  price!: number;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  currency!: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}


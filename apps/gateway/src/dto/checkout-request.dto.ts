import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum CheckoutPaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
  CASHFREE = 'cashfree',
}

export class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
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

export class CheckoutRequestDto {
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsEnum(CheckoutPaymentProvider)
  @IsOptional()
  paymentProvider?: CheckoutPaymentProvider;
}



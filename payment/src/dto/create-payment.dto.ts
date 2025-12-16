import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}


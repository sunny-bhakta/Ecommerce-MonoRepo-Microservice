import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateRefundDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;
}


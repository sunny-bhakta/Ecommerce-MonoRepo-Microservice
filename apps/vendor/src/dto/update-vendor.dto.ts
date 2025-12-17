import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { KycStatus } from '../entities/vendor.entity';

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(KycStatus))
  kycStatus?: KycStatus;
}


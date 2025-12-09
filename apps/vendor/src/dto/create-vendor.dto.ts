import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}


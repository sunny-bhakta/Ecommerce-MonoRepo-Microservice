import { IsBoolean, IsOptional, IsPostalCode, IsString, MaxLength } from 'class-validator';

export class UserAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  label?: string;

  @IsString()
  @MaxLength(120)
  line1!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  line2?: string;

  @IsString()
  @MaxLength(60)
  city!: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  state?: string;

  @IsString()
  @MaxLength(60)
  country!: string;

  @IsPostalCode('any')
  @IsOptional()
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}



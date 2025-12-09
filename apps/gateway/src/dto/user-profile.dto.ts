import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class GatewayUserAddressDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(12)
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateGatewayUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GatewayUserAddressDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @IsOptional()
  addresses?: GatewayUserAddressDto[];

  @IsOptional()
  preferences?: Record<string, unknown>;
}

export class UpdateGatewayUserDto extends CreateGatewayUserDto {}



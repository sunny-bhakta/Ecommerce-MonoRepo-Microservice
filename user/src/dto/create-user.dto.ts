import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { UserAddressDto } from './address.dto';

export class CreateUserDto {
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
  @Type(() => UserAddressDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @IsOptional()
  addresses?: UserAddressDto[];

  @IsOptional()
  preferences?: Record<string, unknown>;
}



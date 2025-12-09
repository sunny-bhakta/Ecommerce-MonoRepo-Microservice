import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeDto } from './attribute.dto';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}


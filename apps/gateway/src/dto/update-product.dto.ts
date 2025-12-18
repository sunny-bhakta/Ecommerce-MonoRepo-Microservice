import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeDto } from './attribute.dto';
import { OptionDefinitionDto } from './option-definition.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDefinitionDto)
  options?: OptionDefinitionDto[];
}

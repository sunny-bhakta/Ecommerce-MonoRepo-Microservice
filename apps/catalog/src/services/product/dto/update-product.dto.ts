import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeDto } from './attribute.dto';
import { OptionDefinitionDto } from './option-definition.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Display name of the product' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the product' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category identifier the product belongs to' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Optional leaf subcategory identifier belonging to the category' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  subCategoryId?: string | null;

  @ApiPropertyOptional({ description: 'Base price in store currency', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ type: () => [AttributeDto], description: 'Base attributes applied to all variants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @ApiPropertyOptional({ type: () => [OptionDefinitionDto], description: 'Option definitions for variants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDefinitionDto)
  options?: OptionDefinitionDto[];
}
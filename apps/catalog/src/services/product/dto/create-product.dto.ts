import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeDto } from './attribute.dto';
import { CreateVariantDto } from './create-variant.dto';
import { OptionDefinitionDto } from './option-definition.dto';

export class CreateProductDto {
  @ApiProperty({ description: 'Display name of the product' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Detailed description of the product' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Category identifier the product belongs to' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  categoryId!: string;

  @ApiPropertyOptional({
    description: 'Optional leaf subcategory identifier belonging to the selected category',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  subCategoryId?: string;

  @ApiProperty({ description: 'Base price in store currency', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ type: () => [AttributeDto], description: 'Base attributes applied to all variants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @ApiPropertyOptional({ description: 'Vendor identifier associated with the product' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  vendorId?: string;

  @ApiPropertyOptional({ type: () => [OptionDefinitionDto], description: 'Option definitions for variants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDefinitionDto)
  options?: OptionDefinitionDto[];

  @ApiPropertyOptional({ type: () => [CreateVariantDto], description: 'Initial variants to create with the product' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'], description: 'Moderation status of the product' })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}
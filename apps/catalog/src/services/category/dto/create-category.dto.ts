import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocaleLabelDto {
  @ApiProperty({ example: 'en-US' })
  @IsString()
  locale!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  label!: string;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Display name of the category' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Parent category identifier' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'SEO-friendly slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Ordering index for the category', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortIndex?: number;

  @ApiPropertyOptional({ description: 'Visibility flag' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ type: () => [LocaleLabelDto], description: 'Localized labels for the category' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocaleLabelDto)
  localeNames?: LocaleLabelDto[];
}
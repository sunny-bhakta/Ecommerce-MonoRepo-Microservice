import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { LocaleLabelDto } from './create-category.dto';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Display name of the category' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'SEO-friendly slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Parent category identifier', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  parentId?: string | null;

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
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListProductsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by vendor identifier', format: 'mongo-id' })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Filter by category identifier', format: 'mongo-id' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by subcategory identifier', format: 'mongo-id' })
  @IsOptional()
  @IsMongoId()
  subCategoryId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'], description: 'Filter by moderation status' })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'name', 'basePrice'], description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'basePrice'])
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'basePrice' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort direction', default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'desc';
}

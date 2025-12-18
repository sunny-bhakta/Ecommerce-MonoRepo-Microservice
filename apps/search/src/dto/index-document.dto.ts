import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export type SearchDocumentType = 'product' | 'category' | 'general';

export class IndexDocumentDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['product', 'category', 'general'])
  type?: SearchDocumentType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}


import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { SearchDocumentType } from './index-document.dto';

export class SearchQueryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['product', 'category', 'general'])
  type?: SearchDocumentType;
}


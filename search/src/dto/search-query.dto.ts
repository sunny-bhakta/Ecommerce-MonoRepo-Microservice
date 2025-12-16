import { IsArray, IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}


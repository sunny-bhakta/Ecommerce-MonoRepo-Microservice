import { IsOptional, IsString } from 'class-validator';

export class FlagReviewDto {
  @IsOptional()
  @IsString()
  reason?: string;
}


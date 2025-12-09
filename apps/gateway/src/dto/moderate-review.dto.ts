import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModerateReviewDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  moderatorNote?: string;
}


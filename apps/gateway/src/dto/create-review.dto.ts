import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  targetId!: string;

  @IsIn(['product', 'vendor'])
  targetType!: 'product' | 'vendor';

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}


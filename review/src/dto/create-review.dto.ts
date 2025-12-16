import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  userId!: string;

  @IsString()
  targetId!: string; // productId or vendorId

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


import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAdminActionDto {
  @IsIn(['pending', 'in_progress', 'completed', 'rejected'])
  status!: 'pending' | 'in_progress' | 'completed' | 'rejected';

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}


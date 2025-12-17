import { IsIn, IsString } from 'class-validator';

export class UpdateProductStatusDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status!: 'pending' | 'approved' | 'rejected';
}


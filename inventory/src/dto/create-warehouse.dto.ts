import { IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;
}


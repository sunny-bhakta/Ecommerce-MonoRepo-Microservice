import { IsString } from 'class-validator';

export class AttributeDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}


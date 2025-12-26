import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttributeDto {
  @ApiProperty({ example: 'color' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 'red' })
  @IsString()
  @IsNotEmpty()
  value!: string;
}
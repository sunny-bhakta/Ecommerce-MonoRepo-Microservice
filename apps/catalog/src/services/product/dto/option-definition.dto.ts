import { ArrayMinSize, ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptionDefinitionDto {
  @ApiProperty({ example: 'size' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: ['S', 'M', 'L'], type: [String], description: 'Distinct option values' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  values!: string[];
}
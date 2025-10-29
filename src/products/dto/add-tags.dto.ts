// src/products/dto/add-tags.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';

export class AddTagsDto {
  @ApiProperty({
    description:
      'An array of tags to add to the product. Duplicates will be ignored.',
    example: ['phone', 'smartphone', 'android'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags: string[];
}

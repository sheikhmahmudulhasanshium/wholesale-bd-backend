// src/products/dto/create-review.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, Length } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'The rating given by the user, from 1 to 5.',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'An optional comment from the user about the product.',
    example: 'This product exceeded my expectations!',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  comment?: string;
}

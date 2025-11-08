// src/categories/dto/create-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The English name of the category.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'ইলেকট্রনিকস',
    description: 'The Bangla name of the category.',
  })
  @IsString()
  @IsNotEmpty()
  name_bn: string;

  @ApiProperty({
    required: false,
    example: 'Gadgets and electronic devices.',
    description: 'A brief English description of the category.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    example: 'মোবাইল ফোন, কম্পিউটার, এবং ইলেকট্রনিক ডিভাইস',
    description: 'A brief Bangla description of the category.',
  })
  @IsOptional()
  @IsString()
  description_bn?: string;

  @ApiProperty({
    required: false,
    example: 'smartphone',
    description: 'The name of the Lucide icon for the category.',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    required: false,
    default: true,
    example: true,
    description: 'Indicates if the category is active. Defaults to true.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    default: 0,
    example: 1,
    description: 'The display order of the category. Defaults to 0.',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

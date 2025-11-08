import { ApiProperty } from '@nestjs/swagger';
import { CategoryDocument } from '../schemas/category.schema';

export class CategoryResponseDto {
  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a47',
    description: 'Unique identifier for the category.',
  })
  _id: string;

  @ApiProperty({
    example: 'Electronics',
    description: 'The English name of the category.',
  })
  name: string;

  @ApiProperty({
    example: 'ইলেকট্রনিকস',
    description: 'The Bangla name of the category.',
  })
  name_bn: string; // New

  @ApiProperty({
    required: false,
    example: 'Gadgets and electronic devices.',
    description: 'A brief English description of the category.',
  })
  description?: string;

  @ApiProperty({
    required: false,
    example: 'মোবাইল ফোন, কম্পিউটার, অ্যাক্সেসরিজ, এবং ইলেকট্রনিক ডিভাইস',
    description: 'A brief Bangla description of the category.',
  })
  description_bn?: string; // New

  @ApiProperty({
    required: false,
    example: 'smartphone',
    description: 'The name of the Lucide icon for the category.',
  })
  icon?: string; // New

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is currently active and visible.',
  })
  isActive: boolean;

  @ApiProperty({
    example: 1,
    description: 'The order in which the category should be displayed.',
  })
  sortOrder: number;

  static fromCategoryDocument(
    categoryDoc: CategoryDocument,
  ): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto._id = categoryDoc._id.toString();
    dto.name = categoryDoc.name;
    dto.name_bn = categoryDoc.name_bn; // Add mapping for new field
    dto.description = categoryDoc.description;
    dto.description_bn = categoryDoc.description_bn; // Add mapping for new field
    dto.icon = categoryDoc.icon; // Add mapping for new field
    dto.isActive = categoryDoc.isActive;
    dto.sortOrder = categoryDoc.sortOrder;
    return dto;
  }
}

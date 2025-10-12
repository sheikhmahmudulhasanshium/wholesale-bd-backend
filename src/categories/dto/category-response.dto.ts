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
    description: 'The name of the category.',
  })
  name: string;

  @ApiProperty({
    required: false,
    example: 'Gadgets and electronic devices.',
    description: 'A brief description of the category.',
  })
  description?: string;

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
    dto.description = categoryDoc.description;
    dto.isActive = categoryDoc.isActive;
    dto.sortOrder = categoryDoc.sortOrder;
    return dto;
  }
}

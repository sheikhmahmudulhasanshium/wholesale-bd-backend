import { CategoryDocument } from '../schemas/category.schema';

export class CategoryResponseDto {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
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

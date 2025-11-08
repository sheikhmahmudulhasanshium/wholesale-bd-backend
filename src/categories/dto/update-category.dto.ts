// src/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

// PartialType makes all properties of CreateCategoryDto optional.
// This is perfect for PATCH requests where you only want to update some fields.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ sortOrder: 1 }).exec();
  }

  async countAll(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }

  // <-- SOLUTION: ADD THIS REQUIRED METHOD -->
  /**
   * Finds a single category by its unique ID.
   * This method is required by the UploadsService to validate that a category
   * exists before media can be associated with it.
   * @param id The string representation of the MongoDB ObjectId.
   * @returns A promise that resolves to the category document or null if not found.
   */
  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }
  // <-- END OF ADDED METHOD -->
}

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

  // --- ADD THIS NEW METHOD ---
  async countAll(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }
}

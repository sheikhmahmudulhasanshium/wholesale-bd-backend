import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // CREATE
  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const newCategory = new this.categoryModel(createCategoryDto);
    return newCategory.save();
  }

  // READ (All) - Existing Method
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ sortOrder: 1 }).exec();
  }

  // READ (One by ID) - Enhanced Method
  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return category;
  }

  // UPDATE
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const existingCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true }) // { new: true } returns the updated document
      .exec();

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return existingCategory;
  }

  // DELETE
  async remove(id: string): Promise<CategoryDocument> {
    const deletedCategory = await this.categoryModel.findByIdAndDelete(id);
    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return deletedCategory;
  }

  // COUNT - Existing Method
  async countAll(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }
}

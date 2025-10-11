import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '../../products/schemas/category.schema';

@Injectable()
export class CategoriesSeedService {
  private readonly logger = new Logger(CategoriesSeedService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async seed() {
    const categories = [
      { name: 'Electronics', description: 'Gadgets and devices', sortOrder: 1 },
      {
        name: 'Clothing & Textiles',
        description: 'Apparel and fabrics',
        sortOrder: 2,
      },
      {
        name: 'Food & Beverages',
        description: 'Groceries and drinks',
        sortOrder: 3,
      },
      {
        name: 'Home & Garden',
        description: 'Furniture and decor',
        sortOrder: 4,
      },
      {
        name: 'Health & Beauty',
        description: 'Personal care items',
        sortOrder: 5,
      },
    ];

    const existingCategories = await this.categoryModel.countDocuments();
    if (existingCategories > 0) {
      this.logger.log('Categories already seeded. Skipping.');
      return;
    }

    await this.categoryModel.insertMany(categories);
    this.logger.log(`${categories.length} categories seeded successfully.`);
  }
}

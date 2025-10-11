import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product,
  ProductDocument,
} from '../../products/schemas/product.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Category,
  CategoryDocument,
} from '../../products/schemas/category.schema';
import { Zone, ZoneDocument } from '../../products/schemas/zone.schema';

@Injectable()
export class ProductsSeedService {
  private readonly logger = new Logger(ProductsSeedService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>,
  ) {}

  async seed() {
    const existingProducts = await this.productModel.countDocuments();
    if (existingProducts > 0) {
      this.logger.log('Products already seeded. Skipping.');
      return;
    }

    const seller = await this.userModel.findOne({ role: 'seller' });
    const electronics = await this.categoryModel.findOne({
      name: 'Electronics',
    });
    const dhaka = await this.zoneModel.findOne({ code: 'DHA' });

    if (!seller || !electronics || !dhaka) {
      this.logger.warn(
        'Cannot seed products: Missing seller, category, or zone.',
      );
      return;
    }

    const products = [
      {
        name: 'Sample Smartphone',
        description: 'A high-quality sample smartphone for wholesale.',
        categoryId: electronics._id,
        zoneId: dhaka._id,
        sellerId: seller._id,
        pricingTiers: [
          { minQuantity: 10, pricePerUnit: 20000 },
          { minQuantity: 50, pricePerUnit: 18000 },
        ],
        minimumOrderQuantity: 10,
        stockQuantity: 500,
        unit: 'piece',
        brand: 'SampleBrand',
        sku: 'SMP-PH-001',
      },
      {
        name: 'Wholesale Laptop',
        description: 'A powerful laptop for business and personal use.',
        categoryId: electronics._id,
        zoneId: dhaka._id,
        sellerId: seller._id,
        pricingTiers: [
          { minQuantity: 5, pricePerUnit: 60000 },
          { minQuantity: 20, pricePerUnit: 55000 },
        ],
        minimumOrderQuantity: 5,
        stockQuantity: 200,
        unit: 'piece',
        brand: 'SampleBrand',
        sku: 'SMP-LP-001',
      },
    ];

    await this.productModel.insertMany(products);
    this.logger.log(`${products.length} products seeded successfully.`);
  }
}

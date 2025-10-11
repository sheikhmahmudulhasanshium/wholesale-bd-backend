import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // The return type is now strongly typed
  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  // --- NEW METHOD for the counter ---
  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }
}

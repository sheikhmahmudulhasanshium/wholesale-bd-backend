import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { StorageService } from '../storage/storage.service';
import { Express } from 'express';
import { EntityType } from '../storage/schemas/media.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly storageService: StorageService,
  ) {}

  async addMediaToProduct(
    productId: string,
    file: Express.Multer.File,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }

    const mediaDocument = await this.storageService.uploadDirectly(file, {
      entityType: EntityType.PRODUCT,
      entityId: productId,
    });

    product.images.push(mediaDocument._id.toString());
    await product.save();

    await product.populate('images');

    return product;
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().populate('images').exec();
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }
}

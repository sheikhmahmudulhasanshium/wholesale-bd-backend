// FILE: src/products/products.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { StorageService } from '../storage/storage.service';
import { Express } from 'express';
import { EntityType, MediaDocument } from '../storage/schemas/media.schema';

// This custom type is still correct and necessary.
type PopulatedProductDocument = Omit<ProductDocument, 'images'> & {
  images: MediaDocument[];
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly storageService: StorageService,
  ) {}

  async addMediaToProduct(
    productId: string,
    file: Express.Multer.File,
  ): Promise<PopulatedProductDocument> {
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

    const populatedProduct = await product.populate('images');

    // BUILD FIX: Use the 'as unknown as ...' double cast.
    return populatedProduct as unknown as PopulatedProductDocument;
  }

  async findAll(): Promise<PopulatedProductDocument[]> {
    const products = await this.productModel.find().populate('images').exec();

    // BUILD FIX: Use the 'as unknown as ...' double cast.
    return products as unknown as PopulatedProductDocument[];
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }
}

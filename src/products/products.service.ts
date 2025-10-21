// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const { name, sku } = createProductDto;

    const existingProductByName = await this.productModel
      .findOne({ name })
      .exec();
    if (existingProductByName) {
      throw new ConflictException(
        `A product with the name "${name}" already exists.`,
      );
    }

    if (sku) {
      const existingProductBySku = await this.productModel
        .findOne({ sku })
        .exec();
      if (existingProductBySku) {
        throw new ConflictException(
          `A product with the SKU "${sku}" already exists.`,
        );
      }
    }

    try {
      const createdProduct = new this.productModel(createProductDto);
      return await createdProduct.save();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }

    const { name, sku } = updateProductDto;

    if (name) {
      const existingProductByName = await this.productModel
        .findOne({ name, _id: { $ne: id } })
        .exec();
      if (existingProductByName) {
        throw new ConflictException(
          `A product with the name "${name}" already exists.`,
        );
      }
    }

    if (sku) {
      const existingProductBySku = await this.productModel
        .findOne({ sku, _id: { $ne: id } })
        .exec();
      if (existingProductBySku) {
        throw new ConflictException(
          `A product with the SKU "${sku}" already exists.`,
        );
      }
    }

    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID "${id}" not found.`);
      }
      return updatedProduct;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Retrieves products belonging to a specific category ID.
   * @param categoryId The ID of the category.
   * @returns An array of product documents in that category.
   * @throws BadRequestException if the category ID format is invalid.
   */
  async findByCategoryId(categoryId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException(
        `Invalid category ID format: "${categoryId}"`,
      );
    }
    // Mongoose will automatically cast the string categoryId to ObjectId for the query
    const products = await this.productModel
      .find({ categoryId: categoryId })
      .exec();
    return products;
  }

  /**
   * Retrieves products available in a specific zone ID.
   * @param zoneId The ID of the zone.
   * @returns An array of product documents available in that zone.
   * @throws BadRequestException if the zone ID format is invalid.
   */
  async findByZoneId(zoneId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(zoneId)) {
      throw new BadRequestException(`Invalid zone ID format: "${zoneId}"`);
    }
    const products = await this.productModel.find({ zoneId: zoneId }).exec();
    return products;
  }

  /**
   * Retrieves products belonging to a specific seller ID.
   * @param sellerId The ID of the seller.
   * @returns An array of product documents owned by that seller.
   * @throws BadRequestException if the seller ID format is invalid.
   */
  async findBySellerId(sellerId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException(`Invalid seller ID format: "${sellerId}"`);
    }
    const products = await this.productModel
      .find({ sellerId: sellerId })
      .exec();
    return products;
  }

  /**
   * Retrieves the total count of all products.
   * @returns The total number of products.
   */
  async countAllProducts(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
  }
}

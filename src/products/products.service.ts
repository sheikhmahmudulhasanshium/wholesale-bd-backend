<<<<<<< HEAD
// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category } from './schemas/category.schema';
import { Zone } from './schemas/zone.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  PricingTierDto,
} from './dto/product.dto';
=======
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
>>>>>>> main

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
<<<<<<< HEAD
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Zone.name) private zoneModel: Model<Zone>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    sellerId: string,
    imageUrls: string[],
  ): Promise<ProductDocument> {
    await this.validateCategoryAndZone(
      createProductDto.categoryId,
      createProductDto.zoneId,
    );
    this.validatePricingTiers(createProductDto.pricingTiers);
    const product = new this.productModel({
      ...createProductDto,
      images: imageUrls,
      // FIX: Use `new Types.ObjectId()`
      sellerId: new Types.ObjectId(sellerId),
    });
    return product.save();
  }

  async findAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const {
      search,
      categoryId,
      zoneId,
      sellerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const filter: Record<string, any> = { isActive: true };
    if (search) filter.$text = { $search: search };
    // FIX: Use `new Types.ObjectId()`
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);
    if (zoneId) filter.zoneId = new Types.ObjectId(zoneId);
    if (sellerId) filter.sellerId = new Types.ObjectId(sellerId);
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const products: ProductDocument[] = await this.productModel
      .find(filter)
      .populate('categoryId', 'name')
      .populate('zoneId', 'name code')
      .populate('sellerId', 'businessName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await this.productModel.countDocuments(filter);
    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductDocument> {
    // FIX: Use `Types.ObjectId.isValid()`
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID');
    const product = await this.productModel
      .findById(id)
      .populate('categoryId')
      .populate('zoneId')
      .populate('sellerId', 'businessName email phone zone');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    sellerId: string,
    newImageUrls: string[],
  ): Promise<ProductDocument> {
    const product = await this.findOne(id);
    if (product.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }
    if (updateProductDto.categoryId || updateProductDto.zoneId) {
      await this.validateCategoryAndZone(
        updateProductDto.categoryId || product.categoryId.toString(),
        updateProductDto.zoneId || product.zoneId.toString(),
      );
    }
    if (updateProductDto.pricingTiers) {
      this.validatePricingTiers(updateProductDto.pricingTiers);
    }
    const combinedImages = [
      ...(updateProductDto.existingImages || []),
      ...newImageUrls,
    ];
    const updateData: Record<string, any> = { ...updateProductDto };
    delete updateData.existingImages;
    updateData.images = combinedImages;
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedProduct)
      throw new NotFoundException('Product could not be updated');
    return updatedProduct;
  }

  async remove(id: string, sellerId: string): Promise<{ message: string }> {
    const product = await this.findOne(id);
    if (sellerId && product.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('You can only delete your own products');
    }
    product.isActive = false;
    await product.save();
    return { message: 'Product has been deactivated' };
  }

  async getSellerProducts(sellerId: string, query: ProductQueryDto) {
    return this.findAll({ ...query, sellerId });
  }

  async getProductsByZone(zoneId: string, query: ProductQueryDto) {
    const zone = await this.zoneModel.findById(zoneId);
    if (!zone) throw new NotFoundException('Zone not found');
    return this.findAll({ ...query, zoneId });
  }

  private async validateCategoryAndZone(categoryId?: string, zoneId?: string) {
    if (categoryId) {
      const category = await this.categoryModel.findById(categoryId);
      if (!category) throw new BadRequestException('Invalid category ID');
    }
    if (zoneId) {
      const zone = await this.zoneModel.findById(zoneId);
      if (!zone) throw new BadRequestException('Invalid zone ID');
    }
  }

  private validatePricingTiers(tiers: PricingTierDto[]): void {
    if (!tiers || tiers.length === 0) {
      throw new BadRequestException('At least one pricing tier is required');
    }
    const sortedTiers = tiers.sort((a, b) => a.minQuantity - b.minQuantity);
    for (const tier of sortedTiers) {
      if (tier.minQuantity <= 0 || tier.pricePerUnit <= 0) {
        throw new BadRequestException('Quantities and prices must be positive');
      }
    }
=======
  ) {}

  // The return type is now strongly typed
  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  // --- NEW METHOD for the counter ---
  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
>>>>>>> main
  }
}

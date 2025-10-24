// src/collections/collections.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/create-collection.dto';
import { ProductsService } from '../products/products.service';
import { AddProductsDto } from './dto/add-products.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
    private readonly productsService: ProductsService,
  ) {}

  private async validateProducts(
    products: { productId: string }[],
  ): Promise<void> {
    if (!products || products.length === 0) return;

    for (const p of products) {
      try {
        await this.productsService.findOne(p.productId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(
            `Product with ID "${p.productId}" does not exist.`,
          );
        }
        throw error;
      }
    }
  }

  async create(
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionDocument> {
    const existing = await this.collectionModel
      .findOne({ url: createCollectionDto.url })
      .exec();
    if (existing) {
      throw new ConflictException(
        `A collection with the URL "${createCollectionDto.url}" already exists.`,
      );
    }

    await this.validateProducts(createCollectionDto.products);

    const mappedProducts = createCollectionDto.products.map((p) => ({
      product: p.productId,
      priority: p.priority,
    }));

    const createdCollection = new this.collectionModel({
      ...createCollectionDto,
      products: mappedProducts,
    });
    return createdCollection.save();
  }

  async findAll(): Promise<CollectionDocument[]> {
    return this.collectionModel.find().sort({ priority: 'asc' }).exec();
  }

  async findOne(id: string): Promise<CollectionDocument> {
    const collection = await this.collectionModel
      .findById(id)
      .populate('products.product')
      .exec();

    if (!collection) {
      throw new NotFoundException(`Collection with ID "${id}" not found.`);
    }
    return collection;
  }

  async update(
    id: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<CollectionDocument> {
    if (updateCollectionDto.products) {
      await this.validateProducts(updateCollectionDto.products);
    }

    const updatePayload: UpdateQuery<CollectionDocument> = {
      ...updateCollectionDto,
    };

    if (updateCollectionDto.products) {
      updatePayload.products = updateCollectionDto.products.map((p) => ({
        product: p.productId,
        priority: p.priority,
      }));
    }

    const updatedCollection = await this.collectionModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate('products.product')
      .exec();

    if (!updatedCollection) {
      throw new NotFoundException(`Collection with ID "${id}" not found.`);
    }
    return updatedCollection;
  }

  async remove(id: string): Promise<void> {
    const result = await this.collectionModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Collection with ID "${id}" not found.`);
    }
  }

  async findAllPublic(): Promise<CollectionDocument[]> {
    const now = new Date();

    const collections = await this.collectionModel
      .find({
        is_active: true,
        $or: [
          { start_date: { $exists: false }, end_date: { $exists: false } },
          { start_date: { $lte: now }, end_date: { $exists: false } },
          { start_date: { $exists: false }, end_date: { $gte: now } },
          { start_date: { $lte: now }, end_date: { $gte: now } },
        ],
      })
      .sort({ priority: 'asc' })
      .populate({
        path: 'products.product',
        model: 'Product',
      })
      .exec();

    collections.forEach((collection) => {
      if (collection.products && collection.products.length > 0) {
        collection.products.sort((a, b) => a.priority - b.priority);
      }
    });

    return collections;
  }

  async addProductsToCollection(
    collectionId: string,
    addProductsDto: AddProductsDto,
  ): Promise<CollectionDocument> {
    const collection = await this.collectionModel.findById(collectionId);
    if (!collection) {
      throw new NotFoundException(
        `Collection with ID "${collectionId}" not found.`,
      );
    }

    await this.validateProducts(addProductsDto.products);

    const existingProductIds = new Set(
      collection.products.map((p) => p.product.toString()),
    );
    for (const newProduct of addProductsDto.products) {
      if (existingProductIds.has(newProduct.productId)) {
        throw new ConflictException(
          `Product with ID "${newProduct.productId}" is already in this collection.`,
        );
      }
    }

    const productsToAdd = addProductsDto.products.map((p) => ({
      product: new Types.ObjectId(p.productId),
      priority: p.priority,
    }));

    const updatedCollection = await this.collectionModel
      .findByIdAndUpdate(
        collectionId,
        {
          $push: { products: { $each: productsToAdd } },
        },
        { new: true },
      )
      .populate('products.product')
      .exec();

    // +++ THIS IS THE FIX +++
    // Handle the race condition where the collection might have been deleted.
    if (!updatedCollection) {
      throw new NotFoundException(
        `Collection with ID "${collectionId}" not found during update.`,
      );
    }

    return updatedCollection;
  }
}

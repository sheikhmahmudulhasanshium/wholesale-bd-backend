// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  // UnauthorizedException is no longer needed
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Product,
  ProductDocument,
  ProductMedia,
} from './schemas/product.schema';
import {
  CreateProductDto,
  ProductResponseDto,
  UpdateProductDto,
} from './dto/product-response.dto';
import { ProductMediaPurpose } from './enums/product-media-purpose.enum';
import { StorageService } from 'src/storage/storage.service';
import { AddMediaFromUrlDto } from './dto/add-media-from-url.dto';
import { UpdateMediaPropertiesDto } from './dto/update-media-properties.dto';
import { ProductMediaDto } from './dto/product-media.dto';
import { MediaType } from 'src/uploads/enums/media-type.enum';
import { plainToInstance } from 'class-transformer';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as path from 'path';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  // /**
  //  * @deprecated One-time data migration script. Kept for reference.
  //  */
  // private readonly finalMigrationKey = 'RUN-FINAL-IMAGE-REUPLOAD-AND-CLEANUP-20251029';

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
  ) {}

  // /**
  //  * @deprecated One-time data migration script. Kept for reference.
  //  */
  // async runFinalImageMigration(key: string) {
  //   if (key !== this.finalMigrationKey) {
  //     throw new UnauthorizedException('Invalid migration secret key.');
  //   }

  //   this.logger.warn('=== STARTING FINAL IMAGE MIGRATION & CLEANUP SCRIPT ===');
  //   const r2PublicUrl = 'https://pub-1508a97a3d584140a7f32f1ca90490c2.r2.dev';

  //   const products = await this.productModel.find().exec();
  //   this.logger.log(`Found ${products.length} total products to scan.`);

  //   let updatedCount = 0;
  //   const failedItems: { productId: string; url: string; error: string }[] = [];
  //   const deletedItems: { productId: string; url: string; reason: string }[] = [];

  //   for (const product of products) {
  //     let productModified = false;
  //     const mediaItemsToKeep: ProductMedia[] = [];

  //     for (const mediaItem of product.media) {
  //       const isExternal = !mediaItem.url.startsWith(r2PublicUrl) && mediaItem.url.startsWith('http');

  //       if (isExternal) {
  //         this.logger.log(`[Product: ${product._id.toString()}] Processing external URL: ${mediaItem.url}`);
  //         try {
  //           const urlToFetch = new URL(mediaItem.url);
  //           const cleanUrl = `${urlToFetch.origin}${urlToFetch.pathname}`;

  //           const response = await firstValueFrom(
  //             this.httpService.get(cleanUrl, { responseType: 'arraybuffer', timeout: 20000 })
  //           );

  //           const axiosResponse = response as AxiosResponse<ArrayBuffer>;
  //           const contentType = axiosResponse.headers['content-type'] as string | undefined;
  //           if (!contentType?.startsWith('image/')) throw new Error(`Not an image (${contentType})`);

  //           const originalFilename = path.basename(urlToFetch.pathname) || 'migrated-image.jpg';
  //           const buffer = Buffer.from(axiosResponse.data);
  //           const mockFile = {
  //             originalname: originalFilename, mimetype: contentType, size: buffer.length, buffer: buffer,
  //           } as Express.Multer.File;

  //           const { url: newUrl, fileKey } = await this.storageService.uploadFile(mockFile, 'product', MediaType.IMAGE);

  //           mediaItem.url = newUrl;
  //           mediaItem.fileKey = fileKey;
  //           mediaItemsToKeep.push(mediaItem);
  //           productModified = true;
  //           this.logger.log(` -> Successfully re-uploaded to: ${newUrl}`);

  //         } catch (error: unknown) {
  //           const errorMessage = error instanceof Error ? error.message : "Unknown Error";
  //           this.logger.error(` -> FAILED to migrate URL. It will be removed. Reason: ${errorMessage}`);
  //           failedItems.push({ productId: product._id.toString(), url: mediaItem.url, error: errorMessage });
  //           productModified = true;
  //         }
  //       } else if (mediaItem.url.startsWith(r2PublicUrl) && mediaItem.url.includes('?')) {
  //         this.logger.warn(`[Product: ${product._id.toString()}] Deleting broken R2 URL: ${mediaItem.url}`);
  //         deletedItems.push({ productId: product._id.toString(), url: mediaItem.url, reason: "Broken R2 URL with query parameter." });
  //         productModified = true;
  //       } else {
  //         mediaItemsToKeep.push(mediaItem);
  //       }
  //     }

  //     if (productModified) {
  //       product.media = mediaItemsToKeep;
  //       await product.save();
  //       updatedCount++;
  //     }
  //   }

  //   this.logger.warn('=== MIGRATION & CLEANUP FINISHED ===');
  //   return {
  //     productsScanned: products.length,
  //     productsUpdated: updatedCount,
  //     failedMigrationItems: failedItems,
  //     deletedBrokenLinks: deletedItems,
  //   };
  // }

  private _mapProductToResponse(product: ProductDocument): ProductResponseDto {
    const productObj = product.toObject() as Product;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media, images: _images, ...restOfProduct } = productObj;
    const sortedMedia: ProductMedia[] = (media || []).sort(
      (a, b) => a.priority - b.priority,
    );
    const thumbnail =
      sortedMedia.find((m) => m.purpose === ProductMediaPurpose.THUMBNAIL) ||
      null;
    const previews = sortedMedia.filter(
      (m) => m.purpose === ProductMediaPurpose.PREVIEW,
    );
    const sourceObject = {
      ...restOfProduct,
      _id: productObj._id.toString(),
      categoryId: productObj.categoryId.toString(),
      zoneId: productObj.zoneId.toString(),
      sellerId: productObj.sellerId.toString(),
      thumbnail: thumbnail ? ProductMediaDto.fromSchema(thumbnail) : null,
      previews: previews.map((mediaItem) =>
        ProductMediaDto.fromSchema(mediaItem),
      ),
    };
    return plainToInstance(ProductResponseDto, sourceObject);
  }

  private _verifyOwnership(product: ProductDocument, user: UserDocument): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (product.sellerId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You do not have permission to modify this product.',
      );
    }
  }

  async create(
    createProductDto: CreateProductDto,
    user: UserDocument,
  ): Promise<ProductDocument> {
    if (
      user.role === UserRole.SELLER &&
      createProductDto.sellerId !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only create products for your own seller account.',
      );
    }
    const { name, sku, images } = createProductDto;
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
    const createdProduct = new this.productModel(createProductDto);
    if (images && images.length > 0) {
      createdProduct.media = images.map((url, index) => ({
        _id: new Types.ObjectId(),
        url,
        purpose:
          index === 0
            ? ProductMediaPurpose.THUMBNAIL
            : ProductMediaPurpose.PREVIEW,
        priority: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }
    return await createdProduct.save();
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productModel.find().exec();
    return products.map((p) => this._mapProductToResponse(p));
  }

  async findAllActive(): Promise<ProductResponseDto[]> {
    const products = await this.productModel.find({ status: 'active' }).exec();
    return products.map((p) => this._mapProductToResponse(p));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return this._mapProductToResponse(product);
  }

  async findOneActive(id: string): Promise<ProductResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const product = await this.productModel
      .findOne({ _id: id, status: 'active' })
      .exec();
    if (!product) {
      throw new NotFoundException(
        `Product with ID "${id}" not found or is not active.`,
      );
    }
    return this._mapProductToResponse(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: UserDocument,
  ): Promise<ProductResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    this._verifyOwnership(product, user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...updateData } = updateProductDto;
    Object.assign(product, updateData);
    const updatedProduct = await product.save();
    return this._mapProductToResponse(updatedProduct);
  }

  async findByCategoryId(categoryId: string): Promise<ProductResponseDto[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException(
        `Invalid category ID format: "${categoryId}"`,
      );
    }
    const products = await this.productModel
      .find({ categoryId: categoryId })
      .exec();
    return products.map((p) => this._mapProductToResponse(p));
  }

  async findByZoneId(zoneId: string): Promise<ProductResponseDto[]> {
    if (!Types.ObjectId.isValid(zoneId)) {
      throw new BadRequestException(`Invalid zone ID format: "${zoneId}"`);
    }
    const products = await this.productModel.find({ zoneId: zoneId }).exec();
    return products.map((p) => this._mapProductToResponse(p));
  }

  async findBySellerId(sellerId: string): Promise<ProductResponseDto[]> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException(`Invalid seller ID format: "${sellerId}"`);
    }
    const products = await this.productModel
      .find({ sellerId: sellerId })
      .exec();
    return products.map((p) => this._mapProductToResponse(p));
  }

  private async _addMedia(
    productId: string,
    mediaData: { url: string; fileKey?: string },
    purpose: ProductMediaPurpose,
    user: UserDocument,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }
    this._verifyOwnership(product, user);
    if (purpose === ProductMediaPurpose.THUMBNAIL) {
      product.media.forEach((m) => {
        if (m.purpose === ProductMediaPurpose.THUMBNAIL) {
          m.purpose = ProductMediaPurpose.PREVIEW;
        }
      });
    }
    const newMedia: ProductMedia = {
      _id: new Types.ObjectId(),
      url: mediaData.url,
      fileKey: mediaData.fileKey,
      purpose,
      priority: product.media.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    product.media.push(newMedia);
    return product.save();
  }

  async addMediaFromUrl(
    productId: string,
    dto: AddMediaFromUrlDto,
    purpose: ProductMediaPurpose,
    user: UserDocument,
  ): Promise<ProductResponseDto> {
    try {
      let urlToFetch: URL;
      try {
        urlToFetch = new URL(dto.url);
      } catch {
        throw new BadRequestException('Invalid URL format provided.');
      }
      const cleanUrl = `${urlToFetch.origin}${urlToFetch.pathname}`;
      this.logger.log(`Attempting to download image from URL: ${cleanUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(cleanUrl, { responseType: 'arraybuffer' }),
      );
      const axiosResponse = response as AxiosResponse<ArrayBuffer>;
      const contentType = axiosResponse.headers['content-type'] as
        | string
        | undefined;

      if (!contentType?.startsWith('image/')) {
        throw new BadRequestException(
          'The provided URL does not point to a valid image.',
        );
      }
      this.logger.log(`Image downloaded. Re-uploading to storage.`);
      const originalFilename =
        path.basename(urlToFetch.pathname) || 'external-image.jpg';
      const buffer = Buffer.from(axiosResponse.data);
      const mockFile = {
        fieldname: 'file',
        originalname: originalFilename,
        encoding: '7bit',
        mimetype: contentType,
        size: buffer.length,
        buffer: buffer,
      } as Express.Multer.File;
      return await this.addMediaFromFile(productId, mockFile, purpose, user);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process image from URL: ${dto.url}. Error: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Could not process the image from the provided URL. Please ensure it is a direct link to a valid image.`,
      );
    }
  }

  async addMediaFromFile(
    productId: string,
    file: Express.Multer.File,
    purpose: ProductMediaPurpose,
    user: UserDocument,
  ): Promise<ProductResponseDto> {
    const { url, fileKey } = await this.storageService.uploadFile(
      file,
      'product',
      MediaType.IMAGE,
    );
    const updatedProduct = await this._addMedia(
      productId,
      { url, fileKey },
      purpose,
      user,
    );
    return this._mapProductToResponse(updatedProduct);
  }

  async updateMediaProperties(
    productId: string,
    mediaId: string,
    dto: UpdateMediaPropertiesDto,
    user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }
    this._verifyOwnership(product, user);
    const mediaItem = product.media.find(
      (m) => m._id.toHexString() === mediaId,
    );
    if (!mediaItem) {
      throw new NotFoundException(
        `Media with ID "${mediaId}" not found on this product.`,
      );
    }
    if (
      dto.purpose === ProductMediaPurpose.THUMBNAIL &&
      mediaItem.purpose !== ProductMediaPurpose.THUMBNAIL
    ) {
      product.media.forEach((m) => {
        if (m.purpose === ProductMediaPurpose.THUMBNAIL) {
          m.purpose = ProductMediaPurpose.PREVIEW;
        }
      });
    }
    if (dto.purpose) {
      mediaItem.purpose = dto.purpose;
    }
    if (dto.priority !== undefined) {
      mediaItem.priority = dto.priority;
    }
    await product.save();
    return this._mapProductToResponse(product);
  }

  async deleteMedia(
    productId: string,
    mediaId: string,
    user: UserDocument,
  ): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }
    this._verifyOwnership(product, user);
    const mediaToDelete = product.media.find(
      (m) => m._id.toHexString() === mediaId,
    );
    if (mediaToDelete?.fileKey) {
      this.storageService.deleteFile(mediaToDelete.fileKey).catch((err) => {
        console.error(
          `Failed to delete file from storage: ${mediaToDelete.fileKey}`,
          err,
        );
      });
    }
    product.media = product.media.filter(
      (m) => m._id.toHexString() !== mediaId,
    );
    await product.save();
    return this._mapProductToResponse(product);
  }

  async remove(id: string, user: UserDocument): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format: "${id}"`);
    }
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    this._verifyOwnership(product, user);
    product.media.forEach((media) => {
      if (media.fileKey) {
        this.storageService.deleteFile(media.fileKey).catch((err) => {
          console.error(
            `Failed to delete file from storage: ${media.fileKey}`,
            err,
          );
        });
      }
    });
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
  }

  async countAllProducts(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }
}

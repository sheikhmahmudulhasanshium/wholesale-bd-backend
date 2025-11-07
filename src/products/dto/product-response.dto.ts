// src/products/dto/product-response.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  Min,
  ValidateNested,
  IsMongoId,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ProductMediaDto } from './product-media.dto';

export class PricingTierDto {
  @ApiProperty({
    description: 'Minimum quantity for this pricing tier',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  minQuantity: number;

  @ApiProperty({
    description:
      'Maximum quantity for this pricing tier (optional for the last tier)',
    example: 9,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @ApiProperty({
    description: 'Price per unit for this pricing tier',
    example: 45000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'The unique name of the product',
    example: 'Samsung Galaxy A54 5G',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'A detailed description of the product',
    example:
      'Latest Samsung smartphone with 5G connectivity, 128GB storage, and triple camera setup',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'DEPRECATED: An array of URLs for product images. Use the new media endpoints instead.',
    type: [String],
    example: ['https://example.com/samsung-a54-front.jpg'],
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true, message: 'Each image URL must be a valid URL' })
  images?: string[];

  @ApiProperty({
    description: 'The MongoDB ObjectId of the category this product belongs to',
    example: '68f4529b0b588f71ad0fa1a4',
  })
  @IsMongoId()
  categoryId: string;

  @ApiProperty({
    description:
      'The MongoDB ObjectId of the zone this product is available in',
    example: '68f4529a0b588f71ad0fa18b',
  })
  @IsMongoId()
  zoneId: string;

  @ApiProperty({
    description: 'The MongoDB ObjectId of the seller who owns this product',
    example: '68f4529b0b588f71ad0fa1ae',
  })
  @IsMongoId()
  sellerId: string;

  // --- V NEW: Regular Unit Price ---
  @ApiProperty({
    description:
      'The regular, non-discounted price per unit. Used as a baseline for calculating discounts.',
    example: 50000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  regularUnitPrice: number;
  // --- ^ END of NEW ---

  @ApiProperty({
    description: 'An array of pricing tiers based on quantity',
    type: [PricingTierDto],
    example: [{ minQuantity: 1, maxQuantity: 9, pricePerUnit: 45000 }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];

  @ApiProperty({
    description: 'The minimum quantity that can be ordered for this product',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  minimumOrderQuantity: number;

  @ApiProperty({
    description: 'The current stock quantity of the product',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({
    description:
      'The unit of measurement for the product (e.g., "piece", "kg")',
    example: 'piece',
  })
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'The brand name of the product',
    example: 'Samsung',
  })
  @IsString()
  brand: string;

  @ApiProperty({
    description: 'The model name of the product',
    example: 'Galaxy A54 5G',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Detailed specifications of the product',
    example: '6.4" Super AMOLED, Exynos 1380, 8GB RAM, 128GB Storage',
    required: false,
  })
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiProperty({
    description: 'The current status of the product',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived';

  @ApiProperty({
    description: 'The Stock Keeping Unit (SKU) of the product',
    example: 'SAM-A54-128-BLK',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    description: 'The weight of the product in kg',
    example: 0.202,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'The dimensions of the product',
    example: '158.2 x 76.7 x 8.2 mm',
    required: false,
  })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({
    description: 'Whether the product is currently active and available',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'The unique ID of the product',
    example: '68f4529b0b588f71ad0fa1b2',
    readOnly: true,
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  _id?: string;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the product',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsMongoId()
  @Transform(
    ({ value }: { value: Types.ObjectId | string }) =>
      value instanceof Types.ObjectId ? value.toHexString() : value,
    { toPlainOnly: true },
  )
  _id: string;

  @ApiProperty({
    description: 'The unique name of the product',
    example: 'Samsung Galaxy A54 5G',
  })
  name: string;

  @ApiProperty({
    description: 'A detailed description of the product',
    example:
      'Latest Samsung smartphone with 5G connectivity, 128GB storage, and triple camera setup',
  })
  description: string;

  @ApiProperty({
    description: 'The primary thumbnail image for the product.',
    type: ProductMediaDto,
    nullable: true,
  })
  @Type(() => ProductMediaDto)
  thumbnail: ProductMediaDto | null;

  @ApiProperty({
    description:
      'An array of preview media items for the product, sorted by priority.',
    type: [ProductMediaDto],
  })
  @Type(() => ProductMediaDto)
  previews: ProductMediaDto[];

  @ApiProperty({
    description: 'The MongoDB ObjectId of the category this product belongs to',
    example: '68f4529b0b588f71ad0fa1a4',
  })
  @Transform(
    ({ value }: { value: Types.ObjectId | string }) =>
      value instanceof Types.ObjectId ? value.toHexString() : value,
    { toPlainOnly: true },
  )
  categoryId: string;

  @ApiProperty({
    description:
      'The MongoDB ObjectId of the zone this product is available in',
    example: '68f4529a0b588f71ad0fa18b',
  })
  @Transform(
    ({ value }: { value: Types.ObjectId | string }) =>
      value instanceof Types.ObjectId ? value.toHexString() : value,
    { toPlainOnly: true },
  )
  zoneId: string;

  @ApiProperty({
    description: 'The MongoDB ObjectId of the seller who owns this product',
    example: '68f4529b0b588f71ad0fa1ae',
  })
  @Transform(
    ({ value }: { value: Types.ObjectId | string }) =>
      value instanceof Types.ObjectId ? value.toHexString() : value,
    { toPlainOnly: true },
  )
  sellerId: string;

  // --- V NEW: Regular Unit Price ---
  @ApiProperty({
    description:
      'The regular, non-discounted price per unit. Used as a baseline for calculating discounts.',
    example: 50000,
  })
  regularUnitPrice: number;
  // --- ^ END of NEW ---

  @ApiProperty({
    description: 'An array of pricing tiers based on quantity',
    type: [PricingTierDto],
    example: [{ minQuantity: 1, maxQuantity: 9, pricePerUnit: 45000 }],
  })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];

  @ApiProperty({
    description: 'The minimum quantity that can be ordered for this product',
    example: 1,
    minimum: 1,
  })
  minimumOrderQuantity: number;

  @ApiProperty({
    description: 'The current stock quantity of the product',
    example: 150,
    minimum: 0,
  })
  stockQuantity: number;

  @ApiProperty({
    description:
      'The unit of measurement for the product (e.g., "piece", "kg")',
    example: 'piece',
  })
  unit: string;

  @ApiProperty({
    description: 'The brand name of the product',
    example: 'Samsung',
  })
  brand: string;

  @ApiProperty({
    description: 'The model name of the product',
    example: 'Galaxy A54 5G',
  })
  model: string;

  @ApiProperty({
    description: 'Detailed specifications of the product',
    example: '6.4" Super AMOLED, Exynos 1380, 8GB RAM, 128GB Storage',
    required: false,
  })
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiProperty({
    description: 'The current status of the product',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  status: 'active' | 'inactive' | 'archived';

  @ApiProperty({
    description: 'The current view count of the product',
    example: 2,
    minimum: 0,
  })
  viewCount: number;

  @ApiProperty({
    description: 'The total number of times this product has been ordered',
    example: 0,
    minimum: 0,
  })
  orderCount: number;

  @ApiProperty({
    description: 'The average rating of the product (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'The total number of reviews for the product',
    example: 10,
    minimum: 0,
  })
  reviewCount: number;

  @ApiProperty({
    description: 'The Stock Keeping Unit (SKU) of the product',
    example: 'SAM-A54-128-BLK',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    description: 'The weight of the product in kg',
    example: 0.202,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'The dimensions of the product',
    example: '158.2 x 76.7 x 8.2 mm',
    required: false,
  })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({
    description: 'Whether the product is currently active and available',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp when the product was created',
    example: '2025-10-19T02:53:15.683Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the product was last updated',
    example: '2025-10-19T08:58:48.807Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Mongoose document version key',
    example: 0,
  })
  __v: number;
}

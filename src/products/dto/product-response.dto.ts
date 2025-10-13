// FILE: src/products/dto/product-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  ProductDocument,
  ProductStatus,
  ProductUnit,
} from '../schemas/product.schema';
import { MediaResponseDto } from '../../storage/dto/media-response.dto';
import { MediaDocument } from 'src/storage/schemas/media.schema';

// LINT FIX: Create a type that represents the ProductDocument AFTER population.
// This correctly types `images` as an array of MediaDocuments, not strings.
type PopulatedProductDocument = Omit<ProductDocument, 'images'> & {
  images: MediaDocument[];
};

class PricingTierDto {
  @ApiProperty({
    example: 1,
    description: 'Minimum quantity for this price tier.',
  })
  minQuantity: number;

  @ApiProperty({
    required: false,
    example: 10,
    description:
      'Maximum quantity for this price tier (optional for the last tier).',
  })
  maxQuantity?: number;

  @ApiProperty({
    example: 99.99,
    description: 'Price per unit within this quantity range.',
  })
  pricePerUnit: number;
}

export class ProductResponseDto {
  @ApiProperty({
    example: '65f1c5a0ef3e2bde5f269b58',
    description: 'Unique identifier for the product.',
  })
  _id: string;

  @ApiProperty({
    example: 'High-Quality T-Shirt',
    description: 'Name of the product.',
  })
  name: string;

  @ApiProperty({
    example: 'A comfortable and durable t-shirt made from 100% cotton.',
    description: 'Detailed description of the product.',
  })
  description: string;

  @ApiProperty({
    type: [MediaResponseDto],
    description: 'Array of rich media objects for the product.',
  })
  images: MediaResponseDto[];

  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a47',
    description: 'ID of the product category.',
  })
  categoryId: string;

  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a48',
    description: 'ID of the zone where the product is available.',
  })
  zoneId: string;

  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a49',
    description: 'ID of the seller who listed the product.',
  })
  sellerId: string;

  @ApiProperty({
    type: [PricingTierDto],
    description: 'Defines different prices for different quantities.',
  })
  pricingTiers: PricingTierDto[];

  @ApiProperty({
    example: 10,
    description:
      'The minimum quantity required to place an order for this product.',
  })
  minimumOrderQuantity: number;

  @ApiProperty({
    example: 500,
    description: 'Current available stock quantity.',
  })
  stockQuantity: number;

  @ApiProperty({
    example: ProductUnit.PIECE,
    enum: ProductUnit,
    description: 'The unit of measurement for the product (e.g., piece, kg).',
  })
  unit: string;

  @ApiProperty({
    required: false,
    example: 'BrandX',
    description: 'The brand name of the product.',
  })
  brand?: string;

  @ApiProperty({
    example: ProductStatus.ACTIVE,
    enum: ProductStatus,
    description: 'The current status of the product listing.',
  })
  status: string;

  @ApiProperty({
    example: 4.5,
    description: 'The average user rating of the product (0-5).',
  })
  rating: number;

  @ApiProperty({
    example: 25,
    description: 'The total number of reviews for the product.',
  })
  reviewCount: number;

  @ApiProperty({ description: 'Timestamp of product creation.' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last product update.' })
  updatedAt: Date;

  // LINT FIX: Change the parameter type to our new PopulatedProductDocument.
  static fromProductDocument(
    productDoc: PopulatedProductDocument,
  ): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto._id = productDoc._id.toString();
    dto.name = productDoc.name;
    dto.description = productDoc.description;

    // LINT FIX: Now that `productDoc.images` is correctly typed, this mapping is safe.
    dto.images = Array.isArray(productDoc.images)
      ? productDoc.images.map((media) => ({
          _id: media._id.toString(),
          url: media.url,
          altText: media.altText,
          mimeType: media.mimeType,
        }))
      : [];

    dto.categoryId = productDoc.categoryId;
    dto.zoneId = productDoc.zoneId;
    dto.sellerId = productDoc.sellerId;
    dto.pricingTiers = productDoc.pricingTiers;
    dto.minimumOrderQuantity = productDoc.minimumOrderQuantity;
    dto.stockQuantity = productDoc.stockQuantity;
    dto.unit = productDoc.unit;
    dto.brand = productDoc.brand;
    dto.status = productDoc.status;
    dto.rating = productDoc.rating;
    dto.reviewCount = productDoc.reviewCount;
    dto.createdAt = productDoc.createdAt;
    dto.updatedAt = productDoc.updatedAt;
    return dto;
  }
}

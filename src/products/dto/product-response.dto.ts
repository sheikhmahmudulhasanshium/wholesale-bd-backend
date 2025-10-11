import { ProductDocument } from '../schemas/product.schema';

// Defines the data structure for a product when sent in an API response.
export class ProductResponseDto {
  _id: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string;
  zoneId: string;
  sellerId: string;
  pricingTiers: {
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }[];
  minimumOrderQuantity: number;
  stockQuantity: number;
  unit: string;
  brand?: string;
  status: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;

  static fromProductDocument(productDoc: ProductDocument): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto._id = productDoc._id.toString();
    dto.name = productDoc.name;
    dto.description = productDoc.description;
    dto.images = productDoc.images;
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

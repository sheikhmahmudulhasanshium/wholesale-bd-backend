// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductMediaPurpose } from '../enums/product-media-purpose.enum';

// --- V NEW: Nested Schema for Product Media ---
@Schema({ _id: true, timestamps: true }) // _id: true gives each media item a unique ID
export class ProductMedia {
  _id: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, enum: ProductMediaPurpose })
  purpose: ProductMediaPurpose;

  @Prop({ default: 0 })
  priority: number;

  @Prop() // Optional: key if the file is stored in an object storage like S3/R2
  fileKey?: string;

  createdAt: Date;
  updatedAt: Date;
}
export const ProductMediaSchema = SchemaFactory.createForClass(ProductMedia);
// --- ^ END of New Nested Schema ---

export class PricingTier {
  @Prop({ required: true, type: Number, min: 1 })
  minQuantity: number;

  @Prop({ type: Number, min: 1 })
  maxQuantity?: number;

  @Prop({ required: true, type: Number, min: 0 })
  pricePerUnit: number;
}

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  // --- V MODIFIED: Replaced 'images' with the new structured 'media' array ---
  @Prop({ type: [String], default: [] })
  images: string[]; // Kept for backward compatibility, but new logic will use 'media'

  @Prop({ type: [ProductMediaSchema], default: [] })
  media: ProductMedia[];
  // --- ^ END of MODIFICATION ---

  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Zone' })
  zoneId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  sellerId: Types.ObjectId;

  @Prop({ type: [PricingTier], required: true })
  pricingTiers: PricingTier[];

  @Prop({ required: true, type: Number, min: 1 })
  minimumOrderQuantity: number;

  @Prop({ required: true, type: Number, min: 0 })
  stockQuantity: number;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ trim: true })
  specifications?: string;

  @Prop({
    required: true,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0 })
  orderCount: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  reviewCount: number;

  @Prop({ unique: true, sparse: true, trim: true })
  sku?: string;

  @Prop({ type: Number, min: 0 })
  weight?: number;

  @Prop({ trim: true })
  dimensions?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: Number })
  __v: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ brand: 1, model: 1 });
ProductSchema.index({ status: 1 });

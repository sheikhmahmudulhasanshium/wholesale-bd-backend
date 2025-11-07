// src/products/schemas/product.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductMediaPurpose } from '../enums/product-media-purpose.enum';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Review {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, required: false })
  comment?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
export const ReviewSchema = SchemaFactory.createForClass(Review);

@Schema({ _id: true, timestamps: true })
export class ProductMedia {
  _id: Types.ObjectId;
  @Prop({ required: true })
  url: string;
  @Prop({ required: true, enum: ProductMediaPurpose })
  purpose: ProductMediaPurpose;
  @Prop({ default: 0 })
  priority: number;
  @Prop()
  fileKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
export const ProductMediaSchema = SchemaFactory.createForClass(ProductMedia);

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

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [ProductMediaSchema], default: [] })
  media: ProductMedia[];

  @Prop({ type: [ReviewSchema], default: [] })
  reviews: Review[];

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Zone' })
  zoneId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  sellerId: Types.ObjectId;

  // --- V NEW: Regular Unit Price ---
  @Prop({ required: true, type: Number, min: 0 })
  regularUnitPrice: number;
  // --- ^ END of NEW ---

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

ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    brand: 'text',
    model: 'text',
    specifications: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      brand: 5,
      model: 5,
      tags: 4,
      specifications: 2,
      description: 1,
    },
    name: 'ProductTextIndex_v2',
    default_language: 'none',
  },
);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  _id: Types.ObjectId; // Explicitly define _id to help TypeScript

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

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

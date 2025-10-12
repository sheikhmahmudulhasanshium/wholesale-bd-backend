import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

// --- Enums for Type Safety ---
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum ProductUnit {
  PIECE = 'piece',
  KG = 'kg',
  SET = 'set',
  BOTTLE = 'bottle',
  PAIR = 'pair',
}

// --- Nested Schema for Pricing Tiers ---
@Schema({ _id: false })
class PricingTier {
  @Prop({ required: true })
  minQuantity: number;

  @Prop()
  maxQuantity?: number; // Optional for the highest tier

  @Prop({ required: true })
  pricePerUnit: number;
}
const PricingTierSchema = SchemaFactory.createForClass(PricingTier);

// --- Main Product Schema ---
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // --- Relationships ---
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true })
  zoneId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sellerId: string;

  // --- Pricing & Inventory ---
  @Prop({ type: [PricingTierSchema], default: [] })
  pricingTiers: PricingTier[];

  @Prop({ required: true })
  minimumOrderQuantity: number;

  @Prop({ default: 0 })
  stockQuantity: number;

  @Prop({ type: String, enum: ProductUnit, required: true })
  unit: ProductUnit;

  // --- Details & Specifications ---
  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  specifications?: string;

  @Prop()
  sku?: string;

  @Prop()
  weight?: number; // in kg

  @Prop()
  dimensions?: string; // e.g., "10 x 5 x 15 cm"

  // --- Status & Metrics ---
  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;
  // Add this inside the Product class
  // --- Timestamps (For TypeScript) ---
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

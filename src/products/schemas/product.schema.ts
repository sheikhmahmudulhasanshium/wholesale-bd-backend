import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
<<<<<<< HEAD
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document<Types.ObjectId>;

=======
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
>>>>>>> main
@Schema({ _id: false })
class PricingTier {
  @Prop({ required: true })
  minQuantity: number;
<<<<<<< HEAD
  @Prop()
  maxQuantity?: number;
  @Prop({ required: true })
  pricePerUnit: number;
}

@Schema({ timestamps: true })
export class Product {
  _id: Types.ObjectId;

=======

  @Prop()
  maxQuantity?: number; // Optional for the highest tier

  @Prop({ required: true })
  pricePerUnit: number;
}
const PricingTierSchema = SchemaFactory.createForClass(PricingTier);

// --- Main Product Schema ---
@Schema({ timestamps: true })
export class Product {
>>>>>>> main
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

<<<<<<< HEAD
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Zone', required: true })
  zoneId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: [PricingTier], required: true })
  pricingTiers: PricingTier[];

  @Prop({ required: true, min: 1 })
  minimumOrderQuantity: number;

  @Prop({ required: true, min: 0 })
  stockQuantity: number;

  @Prop({ required: true })
  unit: string; // e.g., 'piece', 'kg', 'liter'

=======
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
>>>>>>> main
  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  specifications?: string;

<<<<<<< HEAD
  @Prop({ enum: ['active', 'inactive', 'out_of_stock'], default: 'active' })
  status: string;
=======
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
>>>>>>> main

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  orderCount: number;

<<<<<<< HEAD
  @Prop({ default: 0 })
=======
  @Prop({ default: 0, min: 0, max: 5 })
>>>>>>> main
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;
<<<<<<< HEAD

  @Prop({ unique: true, sparse: true }) // SKU should be unique if it exists
  sku?: string;

  @Prop()
  weight?: number; // In kg

  @Prop()
  dimensions?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1, zoneId: 1 });
ProductSchema.index({ sellerId: 1, status: 1 });
=======
  // Add this inside the Product class
  // --- Timestamps (For TypeScript) ---
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
>>>>>>> main

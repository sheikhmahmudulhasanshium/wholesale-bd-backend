import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document<Types.ObjectId>;

@Schema({ _id: false })
class PricingTier {
  @Prop({ required: true })
  minQuantity: number;
  @Prop()
  maxQuantity?: number;
  @Prop({ required: true })
  pricePerUnit: number;
}

@Schema({ timestamps: true })
export class Product {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

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

  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  specifications?: string;

  @Prop({ enum: ['active', 'inactive', 'out_of_stock'], default: 'active' })
  status: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

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

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

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

@Schema({ _id: false })
class PricingTier {
  @Prop({ required: true })
  minQuantity: number;

  @Prop()
  maxQuantity?: number;

  @Prop({ required: true })
  pricePerUnit: number;
}
const PricingTierSchema = SchemaFactory.createForClass(PricingTier);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    default: [],
  })
  images: string[];

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

  @Prop({ type: [PricingTierSchema], default: [] })
  pricingTiers: PricingTier[];

  @Prop({ required: true })
  minimumOrderQuantity: number;

  @Prop({ default: 0 })
  stockQuantity: number;

  @Prop({ type: String, enum: ProductUnit, required: true })
  unit: ProductUnit;

  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  specifications?: string;

  @Prop()
  sku?: string;

  @Prop()
  weight?: number;

  @Prop()
  dimensions?: string;

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

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

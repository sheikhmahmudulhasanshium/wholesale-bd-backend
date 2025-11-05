// src/carts/schemas/cart.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export enum CartStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  CONVERTED = 'converted',
}

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;
}
export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({
    type: String,
    enum: CartStatus,
    required: true,
    default: CartStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: String, default: null })
  shippingAddress: string | null;

  @Prop({ type: String, default: null })
  contactPhone: string | null;
}

export type CartDocument = Cart & Document;
export const CartSchema = SchemaFactory.createForClass(Cart);

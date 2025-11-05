// src/carts/schemas/cart.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CartStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  CONVERTED = 'converted',
}

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;
}
export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  // --- THIS IS THE FIX FOR DUPLICATES ---
  // Adding `unique: true` tells MongoDB to reject any attempt to create a
  // second cart for a userId that already has one. This permanently solves
  // the race condition and duplicate cart issue.
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
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

  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = Cart & Document;
export const CartSchema = SchemaFactory.createForClass(Cart);

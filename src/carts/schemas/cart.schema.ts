// src/cart/schemas/cart.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * This class defines the structure of a single item within the cart's `items` array.
 * We use `@Schema({ _id: false })` because we don't need a separate MongoDB _id for each sub-document.
 */
@Schema({ _id: false })
class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, type: Number })
  quantity: number;
}

// Create a Mongoose schema from the CartItem class definition
const CartItemSchema = SchemaFactory.createForClass(CartItem);

// This is the TypeScript type for a hydrated (Mongoose-aware) Cart document
export type CartDocument = HydratedDocument<Cart>;

/**
 * This class defines the main Cart document structure that will be stored in the 'carts' collection.
 */
@Schema({ timestamps: true })
export class Cart {
  // Mongoose automatically adds the '_id' field.

  @Prop({
    type: Types.ObjectId,
    ref: 'User', // This creates a link to the User model
    required: true,
    unique: true, // A user can only have one cart, which is a critical business rule
    index: true, // We will frequently look up carts by userId, so an index improves performance
  })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  // These fields are automatically managed by Mongoose because of the `{ timestamps: true }` option.
  // We declare them here so TypeScript knows they exist on the document.
  createdAt: Date;
  updatedAt: Date;
}

// Create the final Mongoose schema for the Cart collection from the Cart class
export const CartSchema = SchemaFactory.createForClass(Cart);

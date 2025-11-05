import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
// --- vvvvvv THIS IS THE FIX vvvvvv ---
export class CartItem {
  // --- ^^^^^^ END OF FIX ^^^^^^ ---
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, type: Number })
  quantity: number;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  createdAt: Date;
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

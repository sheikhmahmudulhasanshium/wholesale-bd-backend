import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum OrderStatus {
  PENDING_APPROVAL = 'pending_approval',
  PROCESSING = 'processing',
  READY_FOR_DISPATCH = 'ready_for_dispatch',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  // --- vvvvv THIS IS THE FIX vvvvv ---
  PARTIALLY_REFUNDED = 'partially_refunded',
  // --- ^^^^^ THIS IS THE FIX ^^^^^ ---
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  // --- vvvvv THIS IS THE FIX vvvvv ---
  PARTIALLY_PAID = 'partially_paid',
  // --- ^^^^^ THIS IS THE FIX ^^^^^ ---
}

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;
  @Prop({ required: true })
  productName: string;
  @Prop()
  productSku?: string;
  @Prop()
  thumbnailUrl?: string;
  @Prop({ required: true, min: 1 })
  quantity: number;
  @Prop({ required: true, min: 0 })
  pricePerUnitAtOrder: number;
  @Prop({ required: true, min: 0 })
  totalPrice: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
class ShippingAddress {
  @Prop({ required: true })
  fullName: string;
  @Prop()
  addressLine?: string;
  @Prop({ required: true })
  city: string;
  @Prop({ required: true })
  zone: string;
  @Prop()
  phone?: string;
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    alias: 'customerId',
  })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING_APPROVAL,
  })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

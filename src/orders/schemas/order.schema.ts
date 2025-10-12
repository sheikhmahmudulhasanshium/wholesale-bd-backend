import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

// --- Enums for Type Safety ---
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY_FOR_DISPATCH = 'ready_for_dispatch',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_BANKING = 'mobile_banking',
  CARD = 'card',
}

// --- Nested Schemas ---
@Schema({ _id: false })
class OrderItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop()
  productImage?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  pricePerUnit: number;

  @Prop({ required: true })
  totalPrice: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
class ShippingAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  zone: string;

  @Prop()
  postalCode?: string;
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

// --- Main Order Schema ---
@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  customerId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sellerId: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  // --- Financials ---
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  totalAmount: number;

  // --- Shipping ---
  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  // --- Status & Payment ---
  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  paymentMethod: PaymentMethod;

  @Prop()
  notes?: string;

  // --- Timestamps ---
  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;
  // Add this inside the Order class
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

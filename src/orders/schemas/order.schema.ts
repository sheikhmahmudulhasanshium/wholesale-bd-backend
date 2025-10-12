import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
<<<<<<< HEAD
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document<Types.ObjectId>;

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;
  @Prop({ required: true })
  productName: string;
  @Prop({ required: true, min: 1 })
  quantity: number;
  @Prop({ required: true })
  pricePerUnit: number;
  @Prop({ required: true })
  totalPrice: number;
  @Prop()
  productImage?: string;
}
=======
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
>>>>>>> main

@Schema({ _id: false })
class ShippingAddress {
  @Prop({ required: true })
  fullName: string;
<<<<<<< HEAD
  @Prop({ required: true })
  phone: string;
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  city: string;
  @Prop({ required: true })
  zone: string;
  @Prop({ required: true })
  postalCode: string;
}

@Schema({ timestamps: true })
export class Order {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sellerId: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

=======

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
>>>>>>> main
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  totalAmount: number;

<<<<<<< HEAD
  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({
    enum: [
      'pending',
      'confirmed',
      'processing',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
      'cancelled',
      'rejected',
    ],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  })
  paymentStatus: string;

  @Prop()
  paymentMethod?: string;
=======
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
>>>>>>> main

  @Prop()
  notes?: string;

<<<<<<< HEAD
  @Prop()
  adminNotes?: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  estimatedDeliveryDate?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  dispatchedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;
=======
  // --- Timestamps ---
  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;
  // Add this inside the Order class
  createdAt: Date;
  updatedAt: Date;
>>>>>>> main
}

export const OrderSchema = SchemaFactory.createForClass(Order);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  totalAmount: number;

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

  @Prop()
  notes?: string;

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
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// src/orders/schemas/order-sequence.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderSequenceDocument = OrderSequence & Document;

@Schema()
export class OrderSequence {
  // --- V FIX: Renamed the identifier from '_id' to 'name' ---
  // We use a custom field 'name' to identify our singleton document,
  // instead of trying to override the special '_id' field.
  @Prop({ required: true, unique: true })
  name: string; // e.g., 'orderNumber'
  // --- ^ END of FIX ---

  @Prop({ required: true, default: 0 })
  sequenceValue: number;
}

export const OrderSequenceSchema = SchemaFactory.createForClass(OrderSequence);

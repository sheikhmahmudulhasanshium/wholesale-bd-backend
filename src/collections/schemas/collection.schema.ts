// collection.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// This defines the structure of a product entry *within* a collection
@Schema({ _id: false }) // _id: false because this is a sub-document
export class CollectionProduct {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; // Reference to the actual Product document

  @Prop({ required: true, min: 1 })
  priority: number; // Priority of this product in this collection
}
export const CollectionProductSchema =
  SchemaFactory.createForClass(CollectionProduct);

export type CollectionDocument = Collection & Document;

// This is the main Collection schema
@Schema({ timestamps: true })
export class Collection {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  title_bn: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  description_bn?: string;

  @Prop({ required: true, unique: true, trim: true })
  url: string; // The slug

  @Prop({ trim: true })
  lucide_react_icon?: string;

  @Prop({ required: true, default: 1 })
  priority: number; // Priority of the collection itself

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  start_date?: Date;

  @Prop()
  end_date?: Date;

  // This is where we embed the array of products
  @Prop({ type: [CollectionProductSchema], default: [] })
  products: CollectionProduct[];
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

// Add an index for the URL to ensure fast lookups and enforce uniqueness
CollectionSchema.index({ url: 1 }, { unique: true });

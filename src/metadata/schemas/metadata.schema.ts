// src/metadata/schemas/metadata.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false, versionKey: false })
class Brand {
  @Prop({ type: String, enum: ['configured', 'pending'], default: 'pending' })
  status: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  brandName: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  brandSlogan: any;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  brandSymbol: any[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  brandLogo: any[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  favicon: any[];
}

@Schema({ collection: 'metadata', timestamps: true })
export class Metadata extends Document {
  @Prop({ type: Brand, default: () => ({}) })
  brand: Brand;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  i18n: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  theme: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  social: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  legal: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  pages: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  reusableContent: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { status: 'pending' } })
  seo: any;
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);

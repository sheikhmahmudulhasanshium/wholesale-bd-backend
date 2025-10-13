import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

/**
 * Differentiates between files physically stored in our R2 bucket
 * and links to media hosted on external sites (e.g., YouTube).
 */
export enum MediaType {
  UPLOADED_FILE = 'uploaded_file',
  EXTERNAL_URL = 'external_url',
}

/**
 * Categorizes what the media is for, enabling dynamic references
 * and organized filtering (e.g., find all media for 'products').
 */
export enum EntityType {
  PRODUCT = 'product',
  USER = 'user',
  CATEGORY = 'category',
  ZONE = 'zone',
  BRAND = 'brand',
  ORDER = 'order',
  GENERAL = 'general',
}

@Schema({ _id: false })
class Dimensions {
  @Prop()
  width: number;

  @Prop()
  height: number;
}

@Schema({ timestamps: true, collection: 'media' })
export class Media {
  @Prop({ required: true, trim: true })
  originalName: string; // User-friendly name or original filename

  @Prop({ type: String, enum: MediaType, required: true })
  mediaType: MediaType;

  @Prop({ required: true })
  url: string; // The final public URL (to R2 for uploads, or the external link itself)

  // --- Fields specific to UPLOADED_FILE type ---
  @Prop({ unique: true, sparse: true }) // `sparse` allows multiple nulls for EXTERNAL_URL types
  fileName?: string; // The unique name we generate for storage in R2 (e.g., UUID.ext)

  @Prop()
  mimeType?: string;

  @Prop()
  size?: number; // Size in bytes

  // --- General Metadata (applies to both types) ---
  @Prop({ trim: true })
  altText?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Dimensions })
  dimensions?: Dimensions;

  // --- Entity Linkage ---
  @Prop({ type: String, enum: EntityType, default: EntityType.GENERAL })
  entityType: EntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'entityType' })
  entityId?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

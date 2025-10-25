// src/storage/schemas/media.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EntityModel } from 'src/uploads/enums/entity-model.enum';

export type MediaDocument = Media & Document;

@Schema({ timestamps: true, strict: false }) // Use strict: false to allow dynamic keys
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop()
  fileKey?: string;

  @Prop({ required: true, type: String })
  mediaType: string;

  @Prop()
  mimeType?: string;

  @Prop({ required: true, enum: EntityModel })
  entityModel: EntityModel;

  // --- V ADDED: The new, indexed field for context/purpose ---
  @Prop({ type: String, index: true })
  purpose?: string;
  // --- ^ END OF ADDED FIELD ^ ---

  @Prop()
  originalName?: string;

  @Prop()
  size?: number;

  @Prop()
  description?: string;

  // Note: productId, userId, entityId, entityType etc. are now dynamic.
  // We have removed the old redundant fields from the schema definition.
}

export const MediaSchema = SchemaFactory.createForClass(Media);

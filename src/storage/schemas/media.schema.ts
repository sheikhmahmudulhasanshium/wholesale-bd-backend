import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EntityModel } from 'src/uploads/enums/entity-model.enum';
import { MediaType } from 'src/uploads/enums/media-type.enum';

export type MediaDocument = Media & Document;

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop() // Not required for links
  fileKey?: string;

  @Prop({ required: true, enum: MediaType })
  mediaType: MediaType;

  @Prop() // Not required for links
  mimeType?: string;

  @Prop({ required: true })
  entityId: string; // Storing as string to match your requirement for flexibility

  @Prop({ required: true, enum: EntityModel })
  entityModel: EntityModel;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

// Indexing for faster lookups
MediaSchema.index({ entityId: 1, entityModel: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MetadataDocument = HydratedDocument<Metadata>;

@Schema({ timestamps: true, collection: 'metadatas' })
export class Metadata {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    description:
      'The unique key for the metadata entry (e.g., globalConfig, draft:layoutConfig)',
  })
  key: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description:
      'The value of the entry, which can be any valid JSON structure.',
  })
  // I'm also tightening this from `any` to `Record<string, unknown>` to match our DTO for full type consistency.
  value: Record<string, unknown>;

  @Prop({
    trim: true,
    description: 'An internal-facing description for administrators.',
  })
  description?: string;

  // --- THE FIX ---
  // These properties are managed by Mongoose's `timestamps` option.
  // We declare them here without @Prop() decorators so TypeScript becomes
  // aware of their existence and their type.
  createdAt: Date;
  updatedAt: Date;
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);

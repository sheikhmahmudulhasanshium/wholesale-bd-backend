import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZoneDocument = HydratedDocument<Zone>;

@Schema({ timestamps: true })
export class Zone {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  // For TypeScript awareness of Mongoose's timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ZoneSchema = SchemaFactory.createForClass(Zone);

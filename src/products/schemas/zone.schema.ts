import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ZoneDocument = Zone & Document<Types.ObjectId>;

@Schema({ timestamps: true })
export class Zone {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string; // e.g., 'DHA', 'CTG'

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

// ... (imports and class definition are the same) ...
export const ZoneSchema = SchemaFactory.createForClass(Zone);

// REMOVE: ZoneSchema.index({ name: 1 }); // Handled by `unique: true`
// REMOVE: ZoneSchema.index({ code: 1 }); // Handled by `unique: true`
ZoneSchema.index({ isActive: 1 });
ZoneSchema.index({ sortOrder: 1 });

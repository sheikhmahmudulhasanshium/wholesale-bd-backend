import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document<Types.ObjectId>;

@Schema({ timestamps: true })
export class Category {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

// ... (imports and class definition are the same) ...
export const CategorySchema = SchemaFactory.createForClass(Category);

// REMOVE: CategorySchema.index({ name: 1 }); // Handled by `unique: true`
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

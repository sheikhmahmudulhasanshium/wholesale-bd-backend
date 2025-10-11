import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
  // Add this inside the Category class
  @Prop({ default: false, index: true })
  isSampleData: boolean;
  // For TypeScript awareness of Mongoose's timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

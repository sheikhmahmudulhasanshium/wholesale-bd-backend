import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // English name

  @Prop({ required: true, trim: true })
  name_bn: string; // New: Bangla name

  @Prop({ trim: true })
  description?: string; // English description

  @Prop({ trim: true })
  description_bn?: string; // New: Bangla description

  @Prop({ trim: true })
  icon?: string; // New: Lucide icon name

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

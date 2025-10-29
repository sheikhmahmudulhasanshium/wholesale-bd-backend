// src/search/schemas/search-dictionary.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SearchDictionaryDocument = SearchDictionary & Document;

@Schema({ timestamps: true })
export class SearchDictionary {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  word: string;
}

export const SearchDictionarySchema =
  SchemaFactory.createForClass(SearchDictionary);

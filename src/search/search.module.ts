// src/search/search.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  SearchDictionary,
  SearchDictionarySchema,
} from './schemas/search-dictionary.schema';
import { UserActivityModule } from 'src/user-activity/user-activity.module';
import {
  UserActivity,
  UserActivitySchema,
} from 'src/user-activity/schemas/user-activity.schema'; // --- V NEW: Import UserActivity schema ---

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: SearchDictionary.name, schema: SearchDictionarySchema },
      { name: UserActivity.name, schema: UserActivitySchema }, // --- V FIX: Register the UserActivity model ---
    ]),
    UserActivityModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

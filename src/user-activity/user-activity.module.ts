// src/user-activity/user-activity.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserActivityService } from './user-activity.service';
import {
  UserActivity,
  UserActivitySchema,
} from './schemas/user-activity.schema';
import { ProductsModule } from 'src/products/products.module'; // --- V NEW ---
import { CategoriesModule } from 'src/categories/categories.module'; // --- V NEW ---
import { UserActivityController } from './user-activity.controller'; // --- V NEW ---
import { Product, ProductSchema } from 'src/products/schemas/product.schema'; // --- V NEW ---
import {
  Category,
  CategorySchema,
} from 'src/categories/schemas/category.schema'; // --- V NEW ---

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: Product.name, schema: ProductSchema }, // --- V NEW ---
      { name: Category.name, schema: CategorySchema }, // --- V NEW ---
    ]),
    // Use forwardRef to handle circular dependencies if needed in the future
    forwardRef(() => ProductsModule), // --- V NEW ---
    forwardRef(() => CategoriesModule), // --- V NEW ---
  ],
  providers: [UserActivityService],
  exports: [UserActivityService],
  controllers: [UserActivityController], // --- V NEW ---
})
export class UserActivityModule {}

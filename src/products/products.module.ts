// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PublicProductsController } from './public-products.controller'; // <-- IMPORT NEW CONTROLLER
import { Product, ProductSchema } from './schemas/product.schema';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsController, PublicProductsController], // <-- ADD IT HERE
  providers: [ProductsService, ApiKeyGuard],
  exports: [ProductsService],
})
export class ProductsModule {}

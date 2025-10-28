// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PublicProductsController } from './public-products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { StorageModule } from 'src/storage/storage.module'; // <-- IMPORT STORAGE MODULE
import { HttpModule } from '@nestjs/axios';
//import { MediaType } from 'src/uploads/enums/media-type.enum';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    StorageModule, // <-- ADD STORAGE MODULE TO IMPORTS
    HttpModule,
  ],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService, ApiKeyGuard],
  exports: [ProductsService],
})
export class ProductsModule {}

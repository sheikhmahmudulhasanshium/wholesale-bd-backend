import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { StorageModule } from '../storage/storage.module'; // +++ ADD THIS IMPORT

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    StorageModule, // +++ ADD THIS MODULE TO IMPORTS
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

// collections.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { ProductsModule } from '../products/products.module'; // <-- IMPORTANT

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
    ]),
    ProductsModule, // <-- Import the module that exports ProductsService
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}

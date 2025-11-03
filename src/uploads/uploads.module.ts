// src/uploads/uploads.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Media, MediaSchema } from 'src/storage/schemas/media.schema';
import { HttpModule } from '@nestjs/axios';
import { ProductsModule } from '../products/products.module';
import { UserModule } from '../users/users.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    forwardRef(() => ProductsModule),
    forwardRef(() => UserModule),
    forwardRef(() => CategoriesModule),
    // This line is also required. It tells UploadsModule to look inside OrdersModule for providers.
    forwardRef(() => OrdersModule),
    forwardRef(() => ZonesModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

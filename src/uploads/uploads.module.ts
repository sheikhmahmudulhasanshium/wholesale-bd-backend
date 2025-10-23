// src/uploads/uploads.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Media, MediaSchema } from 'src/storage/schemas/media.schema';

// --- IMPORT ALL MODULES WHOSE SERVICES ARE INJECTED ---
import { ProductsModule } from '../products/products.module';
import { UserModule } from '../users/users.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module'; // This import must be here
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),

    // --- ADD ALL DEPENDENT MODULES TO THE IMPORTS ARRAY ---
    forwardRef(() => ProductsModule),
    forwardRef(() => UserModule),
    forwardRef(() => CategoriesModule),
    forwardRef(() => OrdersModule), // This line connects the modules
    forwardRef(() => ZonesModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

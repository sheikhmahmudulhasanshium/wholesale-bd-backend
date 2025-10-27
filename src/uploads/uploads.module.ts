import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Media, MediaSchema } from 'src/storage/schemas/media.schema';
import { HttpModule } from '@nestjs/axios';

// --- IMPORT ALL MODULES WHOSE SERVICES ARE INJECTED ---
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
    forwardRef(() => OrdersModule),
    forwardRef(() => ZonesModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  // --- vvvvvvvvvv FIX APPLIED HERE vvvvvvvvvv ---
  // Export UploadsService so it can be injected into other modules, like UserService.
  exports: [UploadsService],
  // --- ^^^^^^^^^^ FIX APPLIED HERE ^^^^^^^^^^ ---
})
export class UploadsModule {}

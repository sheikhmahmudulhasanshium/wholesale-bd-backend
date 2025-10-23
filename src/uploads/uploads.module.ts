import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';

// --- IMPORT MODULES WHOSE SERVICES ARE NEEDED FOR VALIDATION ---
import { ProductsModule } from '../products/products.module';
import { UserModule } from '../users/users.module';
import { Media, MediaSchema } from 'src/storage/schemas/media.schema';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    // Use forwardRef to prevent circular dependency issues
    forwardRef(() => ProductsModule),
    forwardRef(() => UserModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

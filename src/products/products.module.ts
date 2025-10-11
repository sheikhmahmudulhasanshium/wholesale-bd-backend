import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Zone, ZoneSchema } from './schemas/zone.schema';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { SellerApprovalGuard } from '../auth/guards/seller-approval.guard';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { R2UploadService } from '../common/services/r2-upload.service';
import { CategoriesController } from './categories.controller';
import { ZonesController } from './zones.controller';

const MODELS = [
  { name: Product.name, schema: ProductSchema },
  { name: Category.name, schema: CategorySchema },
  { name: Zone.name, schema: ZoneSchema },
];

@Module({
  imports: [
    MongooseModule.forFeature(MODELS), // Use the constant here
    UsersModule,
    CommonModule,
  ],
  controllers: [ProductsController, CategoriesController, ZonesController],
  providers: [ProductsService, SellerApprovalGuard, R2UploadService],
  // FIX: Export both the service and the MongooseModule to make models available to other modules
  exports: [ProductsService, MongooseModule.forFeature(MODELS)],
})
export class ProductsModule {}

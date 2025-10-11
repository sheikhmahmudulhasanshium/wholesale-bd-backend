import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Zone, ZoneSchema } from '../products/schemas/zone.schema';
import { Category, CategorySchema } from '../products/schemas/category.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EmailService } from './email.service';
import { SeedService } from './seeds/seed.service';
import { R2UploadService } from './services/r2-upload.service';
import { ZonesSeedService } from './seeds/zones.seed';
import { CategoriesSeedService } from './seeds/categories.seed';
import { UsersSeedService } from './seeds/users.seed';
import { ProductsSeedService } from './seeds/products.seed';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Zone.name, schema: ZoneSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    EmailService,
    R2UploadService,
    SeedService,
    ZonesSeedService,
    CategoriesSeedService,
    UsersSeedService,
    ProductsSeedService,
  ],
  exports: [EmailService, R2UploadService, SeedService],
})
export class CommonModule {}

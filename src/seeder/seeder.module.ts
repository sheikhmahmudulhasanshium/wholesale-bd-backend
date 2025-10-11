import { Module } from '@nestjs/common';
import { SeederController } from './seeder.controller';
import { SeederService } from './seeder.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';
import { Zone, ZoneSchema } from '../zones/schemas/zone.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    ConfigModule,
    // Import all the schemas the seeder needs to interact with
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Zone.name, schema: ZoneSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [SeederController],
  providers: [SeederService],
})
export class SeederModule {}

// src/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';

import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import {
  OrderSequence,
  OrderSequenceSchema,
} from './schemas/order-sequence.schema';
import { Cart, CartSchema } from 'src/carts/schemas/cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderSequence.name, schema: OrderSequenceSchema },
      // Models needed by the OrdersService
      { name: Cart.name, schema: CartSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  // --- V THIS IS THE CRITICAL FIX ---
  // We MUST export the OrdersService so that other modules (like UploadsModule) can inject it.
  exports: [OrdersService],
  // --- ^ END OF CRITICAL FIX ^ ---
})
export class OrdersModule {}

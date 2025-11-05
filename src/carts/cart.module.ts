// src/cart/cart.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { ProductsModule } from '../products/products.module'; // <-- Import ProductsModule
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    ProductsModule, // <-- Add ProductsModule here
    UserModule, // <-- Add UsersModule here
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}

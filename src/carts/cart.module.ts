// src/carts/cart.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { ProductsModule } from '../products/products.module';
import { User, UserSchema } from 'src/users/schemas/user.schema'; // <-- Import the User schema
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [
    // Register the Cart schema (already correct)
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),

    // --- THIS IS THE FIX ---
    // Register the User schema within the context of this module so it can be injected.
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // Import other modules to get access to their services (already correct)
    ProductsModule,
    UserModule,
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}

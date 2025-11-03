// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ZonesModule } from './zones/zones.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { validationSchema } from './config/validation';
import configuration from './config/configuration';
import { UploadsModule } from './uploads/uploads.module';
import { StorageModule } from './storage/storage.module';
import { CollectionsModule } from './collections/collections.module';
import { SearchModule } from './search/search.module';
import { UserActivityModule } from './user-activity/user-activity.module';
// --- V NEW: Import the ThrottlerGuard and APP_GUARD provider token ---
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CartModule } from './carts/cart.module';
// --- ^ END of NEW ---

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // --- V MODIFIED: Add a name to the default throttler configuration ---
    ThrottlerModule.forRoot([
      {
        name: 'default', // Name this configuration
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute from the same IP
      },
    ]),
    // --- ^ END of MODIFIED ---

    AuthModule,
    UserModule,
    MailModule,
    ProductsModule,
    CartModule, // This will be added in a later step

    OrdersModule,
    CategoriesModule,
    ZonesModule,
    UploadsModule,
    StorageModule,
    CollectionsModule,
    SearchModule,
    UserActivityModule,
  ],
  controllers: [AppController],
  // --- V NEW: Set the ThrottlerGuard as a global guard ---
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  // --- ^ END of NEW ---
})
export class AppModule {}

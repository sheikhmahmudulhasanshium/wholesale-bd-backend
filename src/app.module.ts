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
//import { ApiKeyGuard } from './auth/guards/api-key.guard';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { validationSchema } from './config/validation';
import configuration from './config/configuration';
import { UploadsModule } from './uploads/uploads.module';
import { StorageModule } from './storage/storage.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: '.env',
    }),

    // THIS IS THE BLOCK TO FIX
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      // FIX: The useFactory must return an object with the 'uri' property for Mongoose.
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    AuthModule,
    UserModule,
    MailModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    ZonesModule,
    UploadsModule,
    StorageModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService], // removed ApiKeyGuard],
})
export class AppModule {}

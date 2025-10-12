// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ZonesModule } from './zones/zones.module';
//import { SeederModule } from './seeder/seeder.module';
import { MetadataModule } from './metadata/metadata.module';
import { StorageModule } from './storage/storage.module';
import { UploadsController } from './uploads/uploads.controller';
import { ValidationConfigService } from './uploads/validation-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      // FIXED: Removed 'async' as it's not needed here
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    UsersModule,

    ProductsModule,

    OrdersModule,

    CategoriesModule,

    ZonesModule,

    MetadataModule,

    StorageModule,
  ],
  controllers: [AppController, UploadsController],
  providers: [AppService, ValidationConfigService],
})
export class AppModule {}

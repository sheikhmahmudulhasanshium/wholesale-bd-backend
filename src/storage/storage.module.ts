// src/storage/storage.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import r2Config from './r2.config';

@Global() // Make the StorageService available everywhere
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [r2Config], // Load our R2 configuration
    }),
  ],
  providers: [StorageService],
  exports: [StorageService], // Export the service so other modules can use it
})
export class StorageModule {}

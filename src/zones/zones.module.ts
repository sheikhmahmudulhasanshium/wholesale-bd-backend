import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import { Zone, ZoneSchema } from './schemas/zone.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Zone.name, schema: ZoneSchema }]),
  ],
  controllers: [ZonesController],
  providers: [ZonesService],
  // <-- SOLUTION: THIS IS THE FINAL FIX -->
  // This line makes the ZonesService public and available to any module that imports ZonesModule.
  exports: [ZonesService],
})
export class ZonesModule {}

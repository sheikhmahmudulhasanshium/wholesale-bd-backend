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
})
export class ZonesModule {}

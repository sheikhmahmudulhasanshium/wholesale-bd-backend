// src/metadata/metadata.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { Metadata, MetadataSchema } from './schemas/metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Metadata.name, schema: MetadataSchema },
    ]),
  ],
  controllers: [MetadataController],
  providers: [MetadataService],
})
export class MetadataModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataService } from './metadata.service';
import { Metadata, MetadataSchema } from './schemas/metadata.schema';
import { PublicMetadataController } from './public-metadata.controller';
import { AdminMetadataController } from './admin-metadata.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Metadata.name, schema: MetadataSchema },
    ]),
  ],
  controllers: [PublicMetadataController, AdminMetadataController],
  providers: [MetadataService],
})
export class MetadataModule {}

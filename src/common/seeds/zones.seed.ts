import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneDocument } from '../../products/schemas/zone.schema';

@Injectable()
export class ZonesSeedService {
  private readonly logger = new Logger(ZonesSeedService.name);

  constructor(@InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>) {}

  async seed() {
    const zones = [
      {
        name: 'Dhaka',
        code: 'DHA',
        description: 'Dhaka Division - Capital region of Bangladesh',
        sortOrder: 1,
      },
      {
        name: 'Chittagong',
        code: 'CTG',
        description: 'Chittagong Division - Port city and commercial hub',
        sortOrder: 2,
      },
      {
        name: 'Rajshahi',
        code: 'RAJ',
        description: 'Rajshahi Division - Northern region',
        sortOrder: 3,
      },
      {
        name: 'Khulna',
        code: 'KHL',
        description: 'Khulna Division - Southwestern region',
        sortOrder: 4,
      },
      {
        name: 'Barishal',
        code: 'BAR',
        description: 'Barishal Division - Southern region',
        sortOrder: 5,
      },
      {
        name: 'Sylhet',
        code: 'SYL',
        description: 'Sylhet Division - Northeastern region',
        sortOrder: 6,
      },
      {
        name: 'Rangpur',
        code: 'RAN',
        description: 'Rangpur Division - Northwestern region',
        sortOrder: 7,
      },
      {
        name: 'Mymensingh',
        code: 'MYM',
        description: 'Mymensingh Division - North-central region',
        sortOrder: 8,
      },
    ];

    const existingZones = await this.zoneModel.countDocuments();
    if (existingZones > 0) {
      this.logger.log('Zones already seeded. Skipping.');
      return;
    }

    await this.zoneModel.insertMany(zones);
    this.logger.log(`${zones.length} zones seeded successfully.`);
  }
}

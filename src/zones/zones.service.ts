import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneDocument } from './schemas/zone.schema';

@Injectable()
export class ZonesService {
  constructor(@InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>) {}

  async findAll(): Promise<ZoneDocument[]> {
    return this.zoneModel.find().sort({ sortOrder: 1 }).exec();
  }

  // --- ADD THIS NEW METHOD ---
  async countAll(): Promise<number> {
    return this.zoneModel.countDocuments().exec();
  }
}

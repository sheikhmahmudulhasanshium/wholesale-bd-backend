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

  async countAll(): Promise<number> {
    return this.zoneModel.countDocuments().exec();
  }

  // <-- SOLUTION: ADD THIS REQUIRED METHOD -->
  /**
   * Finds a single zone by its unique ID.
   * This method is required by the UploadsService to validate that a zone
   * exists before media can be associated with it.
   * @param id The string representation of the MongoDB ObjectId.
   * @returns A promise that resolves to the zone document or null if not found.
   */
  async findById(id: string): Promise<ZoneDocument | null> {
    return this.zoneModel.findById(id).exec();
  }
  // <-- END OF ADDED METHOD -->
}

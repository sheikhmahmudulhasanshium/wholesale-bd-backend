import { ZoneDocument } from '../schemas/zone.schema';

export class ZoneResponseDto {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;

  static fromZoneDocument(zoneDoc: ZoneDocument): ZoneResponseDto {
    const dto = new ZoneResponseDto();
    dto._id = zoneDoc._id.toString();
    dto.name = zoneDoc.name;
    dto.code = zoneDoc.code;
    dto.description = zoneDoc.description;
    dto.isActive = zoneDoc.isActive;
    dto.sortOrder = zoneDoc.sortOrder;
    return dto;
  }
}

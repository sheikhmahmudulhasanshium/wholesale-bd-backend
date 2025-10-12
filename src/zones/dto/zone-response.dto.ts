import { ApiProperty } from '@nestjs/swagger';
import { ZoneDocument } from '../schemas/zone.schema';

export class ZoneResponseDto {
  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a48',
    description: 'Unique identifier for the zone.',
  })
  _id: string;

  @ApiProperty({
    example: 'Dhaka Division',
    description: 'The name of the zone.',
  })
  name: string;

  @ApiProperty({
    example: 'DHK',
    description: 'A short, unique code for the zone.',
  })
  code: string;

  @ApiProperty({
    required: false,
    example: 'Central business and administrative region.',
    description: 'A brief description of the zone.',
  })
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the zone is currently active.',
  })
  isActive: boolean;

  @ApiProperty({
    example: 1,
    description: 'The order in which the zone should be displayed.',
  })
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

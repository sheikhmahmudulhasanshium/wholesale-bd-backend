import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { ZoneResponseDto } from './dto/zone-response.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of zones' })
  @ApiOkResponse({
    description: 'Returns the total count of zones.',
    schema: { example: { totalZones: 8 } },
  })
  async getZoneCount(): Promise<{ totalZones: number }> {
    const count = await this.zonesService.countAll();
    return { totalZones: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all zones' })
  @ApiOkResponse({
    description: 'An array of zone records, sorted by sortOrder.',
    type: [ZoneResponseDto],
  })
  async findAll(): Promise<ZoneResponseDto[]> {
    const zones = await this.zonesService.findAll();
    return zones.map((zone) => ZoneResponseDto.fromZoneDocument(zone));
  }
}

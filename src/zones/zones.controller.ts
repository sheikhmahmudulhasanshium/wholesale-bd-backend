import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { ZoneResponseDto } from './dto/zone-response.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  // --- ADD THIS NEW ENDPOINT ---
  @Get('count')
  @ApiOperation({ summary: 'Get the total number of zones' })
  async getZoneCount(): Promise<{ totalZones: number }> {
    const count = await this.zonesService.countAll();
    return { totalZones: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all zones' })
  async findAll(): Promise<ZoneResponseDto[]> {
    const zones = await this.zonesService.findAll();
    return zones.map((zone) => ZoneResponseDto.fromZoneDocument(zone));
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneDocument } from './schemas/zone.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(@InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>) {}

  @Get()
  @ApiOperation({ summary: 'Get all active zones' })
  @ApiResponse({ status: 200, description: 'List of active zones.' })
  async findAll(): Promise<ZoneDocument[]> {
    return this.zoneModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single zone by ID' })
  @ApiResponse({ status: 200, description: 'Zone details.' })
  @ApiResponse({ status: 404, description: 'Zone not found.' })
  async findOne(@Param('id') id: string): Promise<ZoneDocument> {
    const zone = await this.zoneModel.findById(id).exec();
    if (!zone) {
      throw new NotFoundException(`Zone with ID "${id}" not found`);
    }
    return zone;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new zone (Admin only)' })
  @ApiResponse({ status: 201, description: 'Zone created successfully.' })
  async create(@Body() createZoneDto: CreateZoneDto): Promise<ZoneDocument> {
    const newZone = new this.zoneModel(createZoneDto);
    return newZone.save();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a zone (Admin only)' })
  @ApiResponse({ status: 200, description: 'Zone updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ): Promise<ZoneDocument> {
    const updatedZone = await this.zoneModel
      .findByIdAndUpdate(id, updateZoneDto, { new: true })
      .exec();
    if (!updatedZone) {
      throw new NotFoundException(`Zone with ID "${id}" not found`);
    }
    return updatedZone;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a zone (Admin only)' })
  @ApiResponse({ status: 200, description: 'Zone deactivated successfully.' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const result = await this.zoneModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();
    if (!result) {
      throw new NotFoundException(`Zone with ID "${id}" not found`);
    }
    return { message: 'Zone deactivated successfully' };
  }
}

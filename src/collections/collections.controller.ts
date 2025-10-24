// src/collections/collections.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/create-collection.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { Public } from '../auth/decorators/public.decorator';
import { AddProductsDto } from './dto/add-products.dto';

// FIX: We REMOVED all @ApiTags decorators from the class level.
// The controller's only job is to define the base path.
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}
  @ApiTags('Collections')
  // --- PUBLIC ENDPOINT ---
  @Public()
  @Get()
  // FIX: This endpoint gets ONLY the 'Public - Collections' tag.
  //@ApiTags('Public - Collections')
  @ApiOperation({ summary: 'Get all active public collections' })
  findAllPublic() {
    return this.collectionsService.findAllPublic();
  }

  // --- ADMIN ENDPOINTS ---
  // Every single admin endpoint will get ONLY the 'Admin - Collections' tag.

  @Post('admin')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new collection' })
  create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get('admin')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all collections (Admin View)' })
  findAllAdmin() {
    return this.collectionsService.findAll();
  }

  @Get('admin/:id')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single collection by ID' })
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Post('admin/:id/products')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add products to a collection' })
  addProducts(@Param('id') id: string, @Body() addProductsDto: AddProductsDto) {
    return this.collectionsService.addProductsToCollection(id, addProductsDto);
  }

  @Patch('admin/:id')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a collection' })
  update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete('admin/:id')
  //@ApiTags('Admin - Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a collection' })
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}

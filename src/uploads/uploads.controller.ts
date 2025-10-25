// src/uploads/uploads.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  //UnauthorizedException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  //ApiExcludeEndpoint,
  ApiBearerAuth,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { EntityModel } from './enums/entity-model.enum';
import { MediaDocument } from 'src/storage/schemas/media.schema';
import { CreateLinkDto } from 'src/storage/dto/create-link.dto';
import {
  GroupedMedia,
  PaginatedMediaResponse,
  UploadsService,
} from './uploads.service';
import { ParseEntityModelPipe } from './pipes/parse-entity-model.pipe';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// --- V FIX: Corrected the import path to the shared directory ---
import { PaginationQueryDto } from './dto/pagination-query.dto';
// --- ^ END OF FIX ^ ---

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  // --- V TEMPORARY MIGRATION ENDPOINT - RETAINED FOR REFERENCE ---
  /*
  private readonly MIGRATE_SCRIPT_SECRET_KEY =
    'run-the-very-final-migration-script-000';

  @Get('__internal/run-final-migration')
  @ApiExcludeEndpoint()
  async runDataMigration(
    @Query('secret') secret: string,
  ): Promise<{ message: string }> {
    if (secret !== this.MIGRATE_SCRIPT_SECRET_KEY) {
      throw new UnauthorizedException('Invalid secret key provided.');
    }
    // To re-enable, you would call this.uploadsService.runFinalMigration() here.
    const message = await 'Migration script is disabled.';
    return { message };
  }
  */
  // --- ^ END OF TEMPORARY ENDPOINT ^ ---

  // --- V FIX: There is now only ONE constructor for the class ---
  constructor(private readonly uploadsService: UploadsService) {}
  // --- ^ END OF FIX ^ ---

  @Get()
  @ApiOperation({ summary: 'Retrieve all media with pagination' })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedMediaResponse> {
    return this.uploadsService.findAllPaginated(paginationQuery);
  }

  @Get('by/:entityModel/:entityId')
  @ApiOperation({ summary: 'Get all media for a specific entity' })
  @ApiParam({
    name: 'entityModel',
    required: true,
    description: 'The entity model to fetch media for (e.g., Product, User).',
    enum: EntityModel,
  })
  async findByEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
  ): Promise<GroupedMedia> {
    return this.uploadsService.findByEntityId(entityModel, entityId);
  }

  @Post(':entityModel/:entityId/file')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload a file for an entity' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiParam({ name: 'entityModel', required: true, enum: EntityModel })
  async uploadFileForEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 25 }),
          new FileTypeValidator({ fileType: /^(image|video|audio)\/.+$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MediaDocument> {
    return this.uploadsService.uploadFile(entityModel, entityId, file);
  }

  @Post(':entityModel/:entityId/link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a link for an entity' })
  @ApiParam({ name: 'entityModel', required: true, enum: EntityModel })
  async addLinkForEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<MediaDocument> {
    return this.uploadsService.addLink(entityModel, entityId, createLinkDto);
  }

  @Patch(':mediaId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a media item (e.g., set its purpose)' })
  @ApiResponse({ status: 200, description: 'Media updated successfully.' })
  @ApiNotFoundResponse({ description: 'Media with the given ID not found.' })
  async updateMedia(
    @Param('mediaId') mediaId: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<MediaDocument> {
    return this.uploadsService.update(mediaId, updateMediaDto);
  }

  @Delete(':mediaId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a media item by its ID' })
  async deleteMedia(
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    return this.uploadsService.deleteMedia(mediaId);
  }
}

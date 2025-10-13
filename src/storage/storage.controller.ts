import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { LinkExternalMediaDto } from './dto/link-external-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FindMediaDto } from './dto/find-media.dto';
import { GroupedResult } from './types/storage.types'; // +++ IMPORT THE NEW TYPE

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({
    summary: 'List all media (paginated and filterable)',
    description:
      'Provides a paginated list of all media for a media library feature.',
  })
  @ApiOkResponse({
    description: 'A paginated list of media records.',
  })
  async findAll(@Query() query: FindMediaDto) {
    return this.storageService.findAll(query);
  }

  @Get('overview/all')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({
    summary: 'Get a grouped overview of all media',
    description:
      'Returns all media grouped by entity type (product, user, etc.) and categorized into photos, files, and links. Intended for admin media library UIs.',
  })
  @ApiOkResponse({
    description: 'A structured object containing all categorized media.',
  })
  // +++ ADD THE EXPLICIT RETURN TYPE HERE +++
  async getGroupedOverview(): Promise<GroupedResult> {
    return this.storageService.getGroupedOverview();
  }

  @Post('link-external')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({ summary: 'Link an external media URL' })
  @ApiCreatedResponse({
    description: 'Returns the created media record metadata for the link.',
  })
  async linkExternalMedia(@Body() linkExternalMediaDto: LinkExternalMediaDto) {
    return this.storageService.linkExternalMedia(linkExternalMediaDto);
  }

  @Post('upload-url')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({ summary: 'Generate a presigned URL for file upload' })
  @ApiCreatedResponse({
    description:
      'Returns the presigned URL for the upload and the created media record metadata.',
  })
  async generateUploadUrl(@Body() generateUploadUrlDto: GenerateUploadUrlDto) {
    return this.storageService.generateUploadUrl(generateUploadUrlDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get metadata for a single media file' })
  @ApiOkResponse({ description: 'Returns the media document.' })
  async getMedia(@Param('id') id: string) {
    return this.storageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({ summary: 'Update media metadata' })
  @ApiOkResponse({
    description: 'The media metadata was successfully updated.',
  })
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.storageService.updateMedia(id, updateMediaDto);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiNoContentResponse({
    description: 'Media file and its record were successfully deleted.',
  })
  async deleteMedia(@Param('id') id: string): Promise<void> {
    await this.storageService.deleteMedia(id);
  }
}

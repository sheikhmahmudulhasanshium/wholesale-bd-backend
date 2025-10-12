// src/uploads/uploads.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  UnprocessableEntityException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  UploadBase64Dto,
  UploadFileBodyDto,
  UploadUrlDto,
} from './dto/upload.dto';
import { ValidationConfigService } from './validation-config.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AssetCategory } from './enums/asset-category.enum';
import { ListFilesResponseDto } from './dto/list-files-response.dto';

@ApiTags('Uploads')
@Controller('uploads')
@ApiSecurity('api_key')
@UseGuards(ApiKeyGuard)
export class UploadsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly validationConfigService: ValidationConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all uploaded assets' })
  @ApiOkResponse({
    description: 'A structured list of all assets in storage.',
    type: ListFilesResponseDto,
  })
  async listFiles(): Promise<ListFilesResponseDto> {
    const files = await this.storageService.listFiles();
    const config = this.storageService.config;

    const response: ListFilesResponseDto = {
      images: { pngs: [], jpgs: [], svgs: [], gifs: [], webps: [], others: [] },
      videos: [],
      sounds: [],
      documents: [],
      others: [],
    };

    for (const file of files) {
      if (!file.Key) continue;
      const [category, filename] = file.Key.split('/');
      if (!category || !filename) continue;
      const extension = (filename.split('.').pop() || 'other').toLowerCase();
      const fileDetail = {
        filename,
        url: `${config.publicUrl}/${file.Key}`,
        dimensions: null,
        alt: null,
        details: null,
      };

      // Linter Fix: Check if the string `category` is a valid enum value, safely.
      const isValidCategory = (
        Object.values(AssetCategory) as string[]
      ).includes(category);
      const mappedCategory = isValidCategory
        ? (category as AssetCategory)
        : 'others';

      if (mappedCategory === AssetCategory.Photo) {
        switch (extension) {
          case 'png':
            response.images.pngs.push(fileDetail);
            break;
          case 'jpg':
          case 'jpeg':
            response.images.jpgs.push(fileDetail);
            break;
          case 'svg':
            response.images.svgs.push(fileDetail);
            break;
          case 'gif':
            response.images.gifs.push(fileDetail);
            break;
          case 'webp':
            response.images.webps.push(fileDetail);
            break;
          default:
            response.images.others.push(fileDetail);
            break;
        }
      } else if (mappedCategory === AssetCategory.Video) {
        response.videos.push(fileDetail);
      } else if (mappedCategory === AssetCategory.Sound) {
        response.sounds.push(fileDetail);
      } else if (mappedCategory === AssetCategory.Document) {
        response.documents.push(fileDetail);
      } else {
        response.others.push(fileDetail);
      }
    }
    return response;
  }

  @Get(':category/:filename')
  @ApiOperation({ summary: 'Get metadata for a single asset' })
  @ApiOkResponse({
    description: 'The asset metadata was successfully retrieved.',
  })
  @ApiNotFoundResponse({ description: 'Asset not found.' })
  async getFileDetails(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ) {
    const key = `${category}/${filename}`;
    const metadata = await this.storageService.getFileMetadata(key);
    return {
      key: key,
      url: `${this.storageService.config.publicUrl}/${key}`,
      size: metadata.ContentLength,
      lastModified: metadata.LastModified,
      contentType: metadata.ContentType,
      eTag: metadata.ETag,
    };
  }

  @Post('file')
  @ApiOperation({
    summary: 'Upload a new asset via file (multipart/form-data)',
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['category', 'file'],
      properties: {
        category: {
          type: 'string',
          enum: Object.values(AssetCategory),
          description: 'The category of the asset.',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload.',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileBodyDto,
  ) {
    if (!file)
      throw new UnprocessableEntityException(
        'Validation failed: No file uploaded.',
      );
    const config = this.validationConfigService.getConfig(body.category);
    if (file.size > config.maxSize)
      throw new PayloadTooLargeException(
        `Validation failed: file size (${file.size} bytes) exceeds the limit of ${config.maxSize} bytes.`,
      );
    if (!config.fileType.test(file.mimetype))
      throw new UnprocessableEntityException(
        `Validation failed: file type '${file.mimetype}' is not allowed. Expected pattern: ${config.fileType}`,
      );
    return this.storageService.uploadFile(file, body.category);
  }

  @Put(':category/:filename')
  @ApiOperation({ summary: 'Replace an existing asset with a new file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The new file to replace the existing one.',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'The file was successfully replaced.' })
  @ApiNotFoundResponse({
    description: 'The original asset to replace was not found.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async replaceFile(
    @Param('category') category: AssetCategory,
    @Param('filename') filename: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const key = `${category}/${filename}`;
    await this.storageService.getFileMetadata(key); // Check if the file exists first
    if (!file)
      throw new UnprocessableEntityException(
        'Validation failed: No file uploaded for replacement.',
      );
    const config = this.validationConfigService.getConfig(category);
    if (file.size > config.maxSize)
      throw new PayloadTooLargeException(
        `Validation failed: file size (${file.size} bytes) exceeds the limit of ${config.maxSize} bytes.`,
      );
    if (!config.fileType.test(file.mimetype))
      throw new UnprocessableEntityException(
        `Validation failed: file type '${file.mimetype}' is not allowed. Expected pattern: ${config.fileType}`,
      );
    return this.storageService.replaceFile(key, file);
  }

  @Delete(':category/:filename')
  @ApiOperation({ summary: 'Delete an asset from storage' })
  @ApiResponse({
    status: 204,
    description: 'The asset was successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Asset not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ): Promise<void> {
    const key = `${category}/${filename}`;
    await this.storageService.getFileMetadata(key); // Ensures the file exists before attempting deletion
    await this.storageService.deleteFile(key);
  }

  @Post('base64')
  @ApiOperation({ summary: 'Upload an asset via Base64 data URL' })
  async uploadBase64(@Body() dto: UploadBase64Dto) {
    return this.storageService.uploadBase64(dto);
  }

  @Post('url')
  @ApiOperation({ summary: 'Upload an asset from a public URL' })
  async uploadFromUrl(@Body() dto: UploadUrlDto) {
    return this.storageService.uploadFromUrl(dto);
  }
}

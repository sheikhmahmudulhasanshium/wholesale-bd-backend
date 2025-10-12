// src/uploads/uploads.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  ParseFilePipeBuilder,
  HttpStatus,
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
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AssetCategory } from './enums/asset-category.enum';

@ApiTags('Uploads')
@Controller('uploads')
@ApiSecurity('api_key') // <-- MINIMAL CHANGE: Corrected from 'x-api-key' to 'api_key'
@UseGuards(ApiKeyGuard)
export class UploadsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly validationConfigService: ValidationConfigService,
  ) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload an asset via file (multipart/form-data)' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a file with its category',
    schema: {
      type: 'object',
      required: ['category', 'file'],
      properties: {
        category: {
          type: 'string',
          enum: Object.values(AssetCategory),
          description: 'The category of the asset being uploaded.',
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
    const config = this.validationConfigService.getConfig(body.category);
    const pipe = new ParseFilePipeBuilder()
      .addFileTypeValidator({ fileType: config.fileType })
      .addMaxSizeValidator({ maxSize: config.maxSize })
      .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY });
    await pipe.transform(file);
    return await this.storageService.uploadFile(file, body.category);
  }

  @Post('base64')
  @ApiOperation({ summary: 'Upload an asset via Base64 data URL' })
  async uploadBase64(@Body() dto: UploadBase64Dto) {
    return await this.storageService.uploadBase64(dto);
  }

  @Post('url')
  @ApiOperation({ summary: 'Upload an asset from a public URL' })
  async uploadFromUrl(@Body() dto: UploadUrlDto) {
    return await this.storageService.uploadFromUrl(dto);
  }
}

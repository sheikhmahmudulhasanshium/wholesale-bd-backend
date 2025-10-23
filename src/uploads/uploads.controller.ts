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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// <-- ADDED: Import decorators from @nestjs/swagger for UI enhancements
import { ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EntityModel } from './enums/entity-model.enum';
import { MediaDocument } from 'src/storage/schemas/media.schema';
import { CreateLinkDto } from 'src/storage/dto/create-link.dto';
import { GroupedMedia, UploadsService } from './uploads.service';
import { ParseEntityModelPipe } from './pipes/parse-entity-model.pipe';

@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':entityModel/:entityId')
  // <-- ADDED: Swagger decorator to create a dropdown for the 'entityModel' parameter
  @ApiParam({
    name: 'entityModel',
    required: true,
    description: 'The entity model to fetch media for.',
    enum: EntityModel, // This is the key that creates the dropdown
  })
  async getMediaForEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
  ): Promise<GroupedMedia> {
    return this.uploadsService.findMediaForEntity(entityModel, entityId);
  }

  @Post(':entityModel/:entityId/file')
  @UseInterceptors(FileInterceptor('file'))
  // <-- ADDED: Swagger decorators for documenting file uploads and the entity dropdown
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // Essential for file upload UI in Swagger
        },
      },
    },
  })
  @ApiParam({
    name: 'entityModel',
    required: true,
    description: 'The entity model to associate the file with.',
    enum: EntityModel, // Creates the dropdown
  })
  async uploadFileForEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 25 }), // 25 MB limit
          new FileTypeValidator({
            fileType: /^(image|video|audio)\/.+$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MediaDocument> {
    return this.uploadsService.uploadFile(entityModel, entityId, file);
  }

  @Post(':entityModel/:entityId/link')
  // <-- ADDED: Swagger decorator for the entity dropdown
  @ApiParam({
    name: 'entityModel',
    required: true,
    description: 'The entity model to associate the link with.',
    enum: EntityModel,
  })
  async addLinkForEntity(
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<MediaDocument> {
    return this.uploadsService.addLink(entityModel, entityId, createLinkDto);
  }

  @Delete(':mediaId')
  @HttpCode(HttpStatus.OK)
  async deleteMedia(
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    return this.uploadsService.deleteMedia(mediaId);
  }
}

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
import { EntityModel } from './enums/entity-model.enum';
import { MediaDocument } from 'src/storage/schemas/media.schema'; // Note: You might want to fix this path to './schemas/media.schema'
import { CreateLinkDto } from 'src/storage/dto/create-link.dto'; // Note: You might want to fix this path to './dto/create-link.dto'
import { GroupedMedia, UploadsService } from './uploads.service';
import { ParseEntityModelPipe } from './pipes/parse-entity-model.pipe'; // <-- IMPORT THE PIPE

@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':entityModel/:entityId')
  async getMediaForEntity(
    // USE THE PIPE HERE
    @Param('entityModel', ParseEntityModelPipe) entityModel: EntityModel,
    @Param('entityId') entityId: string,
  ): Promise<GroupedMedia> {
    return this.uploadsService.findMediaForEntity(entityModel, entityId);
  }

  @Post(':entityModel/:entityId/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileForEntity(
    // USE THE PIPE HERE
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
  async addLinkForEntity(
    // USE THE PIPE HERE
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

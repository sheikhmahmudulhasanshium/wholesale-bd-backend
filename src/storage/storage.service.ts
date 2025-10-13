// FILE: src/storage/storage.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Media,
  MediaDocument,
  MediaType,
  EntityType,
} from './schemas/media.schema';
import { Express } from 'express';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { LinkExternalMediaDto } from './dto/link-external-media.dto';
import { FindMediaDto } from './dto/find-media.dto';
import { GroupedResult } from './types/storage.types';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  // FINAL FIX: Restore the correct type. The dependency cleanup should have fixed the underlying issue.
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
  ) {
    this.logger.log('Initializing StorageService...');
    try {
      this.logger.debug('Loading R2 environment variables...');
      this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
      this.publicUrl = this.configService.getOrThrow<string>('R2_PUBLIC_URL');
      const endpoint = this.configService.getOrThrow<string>('R2_ENDPOINT');
      const accessKeyId =
        this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.getOrThrow<string>(
        'R2_SECRET_ACCESS_KEY',
      );
      this.logger.debug('All R2 environment variables loaded successfully.');

      this.logger.debug('Initializing S3Client...');
      this.s3Client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(
        'StorageService initialized successfully with R2 connection.',
      );
    } catch (error) {
      this.logger.error(
        'CRITICAL: Failed to initialize StorageService. Check R2 environment variables.',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw error;
    }
  }

  async uploadDirectly(
    file: Express.Multer.File,
    entityInfo: { entityType: EntityType; entityId: string },
    altText?: string,
  ): Promise<MediaDocument> {
    const { originalname, mimetype, size, buffer } = file;
    const fileExtension = originalname.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: mimetype,
      ContentLength: size,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Directly uploaded file ${uniqueFileName} to R2.`);

      const finalPublicUrl = `${this.publicUrl}/${uniqueFileName}`;

      const newMedia = new this.mediaModel({
        originalName: originalname,
        fileName: uniqueFileName,
        url: finalPublicUrl,
        mimeType: mimetype,
        size: size,
        altText,
        mediaType: MediaType.UPLOADED_FILE,
        entityType: entityInfo.entityType,
        entityId: entityInfo.entityId,
      });

      await newMedia.save();
      return newMedia;
    } catch (error) {
      this.logger.error(
        `Direct upload failed for ${originalname}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new InternalServerErrorException('Could not upload file.');
    }
  }

  async findAll(query: FindMediaDto) {
    const { page = 1, limit = 20, search, entityType, mimeType } = query;
    const skip = (page - 1) * limit;

    const filters: FilterQuery<MediaDocument> = {};

    if (search) {
      filters.originalName = { $regex: search, $options: 'i' };
    }
    if (entityType) {
      filters.entityType = entityType;
    }
    if (mimeType) {
      filters.mimeType = { $regex: mimeType, $options: 'i' };
    }

    const [results, total] = await Promise.all([
      this.mediaModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.mediaModel.countDocuments(filters),
    ]);

    return {
      data: results,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  async generateUploadUrl(
    dto: GenerateUploadUrlDto,
  ): Promise<{ uploadUrl: string; media: MediaDocument }> {
    const { originalName, mimeType, size, altText } = dto;
    const fileExtension = originalName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFileName,
      ContentType: mimeType,
      ContentLength: size,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      const finalPublicUrl = `${this.publicUrl}/${uniqueFileName}`;

      const newMedia = new this.mediaModel({
        originalName,
        fileName: uniqueFileName,
        url: finalPublicUrl,
        mimeType,
        size,
        altText,
        mediaType: MediaType.UPLOADED_FILE,
      });

      await newMedia.save();

      this.logger.log(`Generated upload URL for ${originalName}`);
      return { uploadUrl, media: newMedia };
    } catch (error) {
      this.logger.error(
        'Failed to generate presigned URL',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new InternalServerErrorException(
        'Could not generate file upload URL.',
      );
    }
  }

  async linkExternalMedia(dto: LinkExternalMediaDto): Promise<MediaDocument> {
    const { url, name, description } = dto;

    const newMedia = new this.mediaModel({
      url,
      originalName: name,
      description,
      mediaType: MediaType.EXTERNAL_URL,
    });

    await newMedia.save();
    this.logger.log(`Linked external media: ${name} -> ${url}`);
    return newMedia;
  }

  async deleteMedia(mediaId: string): Promise<void> {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID "${mediaId}" not found.`);
    }

    if (media.mediaType === MediaType.UPLOADED_FILE && media.fileName) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: media.fileName,
      });

      try {
        await this.s3Client.send(command);
        this.logger.log(`Deleted file from R2: ${media.fileName}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete file from R2: ${media.fileName}`,
          error instanceof Error ? error.stack : JSON.stringify(error),
        );
      }
    }

    await this.mediaModel.findByIdAndDelete(mediaId);
    this.logger.log(`Deleted media record from DB: ${mediaId}`);
  }

  async updateMedia(
    mediaId: string,
    dto: UpdateMediaDto,
  ): Promise<MediaDocument> {
    const media = await this.mediaModel.findByIdAndUpdate(mediaId, dto, {
      new: true,
    });
    if (!media) {
      throw new NotFoundException(`Media with ID "${mediaId}" not found.`);
    }

    this.logger.log(`Updated metadata for media ID: ${mediaId}`);
    return media;
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaModel.findById(id).lean();
    if (!media) {
      throw new NotFoundException(`Media file with ID "${id}" not found.`);
    }
    return media;
  }

  async getGroupedOverview(): Promise<GroupedResult> {
    const allMedia = await this.mediaModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    const groupedResult: GroupedResult = {};

    for (const media of allMedia) {
      const entity = media.entityType || 'general';

      if (!groupedResult[entity]) {
        groupedResult[entity] = {
          photos: [],
          files: [],
          links: [],
        };
      }

      if (media.mediaType === MediaType.EXTERNAL_URL) {
        groupedResult[entity].links.push(media as Media);
      } else if (media.mimeType && media.mimeType.startsWith('image/')) {
        groupedResult[entity].photos.push(media as Media);
      } else {
        groupedResult[entity].files.push(media as Media);
      }
    }
    return groupedResult;
  }
}

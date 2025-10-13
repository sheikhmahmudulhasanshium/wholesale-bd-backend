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
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { LinkExternalMediaDto } from './dto/link-external-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FindMediaDto } from './dto/find-media.dto';
import { Express } from 'express';
import { GroupedResult } from './types/storage.types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
  ) {
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.configService.getOrThrow<string>('R2_PUBLIC_URL');

    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('R2_ENDPOINT'),
      region: 'auto',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
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
      this.logger.error(`Direct upload failed for ${originalname}`, error);
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
        expiresIn: 3600, // 1 hour
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
      this.logger.error('Failed to generate presigned URL', error);
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
          error,
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
    const media = await this.mediaModel.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID "${mediaId}" not found.`);
    }

    if (dto.altText !== undefined) media.altText = dto.altText;
    if (dto.description !== undefined) media.description = dto.description;
    if (dto.originalName !== undefined) media.originalName = dto.originalName;

    await media.save();
    this.logger.log(`Updated metadata for media ID: ${mediaId}`);
    return media;
  }

  async findOne(id: string): Promise<MediaDocument> {
    const media = await this.mediaModel.findById(id);
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

// src/storage/storage.service.ts

import {
  Injectable,
  Inject,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import r2Config from './r2.config';
import { UploadBase64Dto, UploadUrlDto } from '../uploads/dto/upload.dto';
import { AssetCategory } from '../uploads/enums/asset-category.enum';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;

  constructor(
    @Inject(r2Config.KEY)
    private readonly config: ConfigType<typeof r2Config>,
  ) {
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('R2 configuration is incomplete.');
    }

    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    category: AssetCategory,
  ): Promise<{ url: string }> {
    return this._uploadBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      category,
    );
  }

  async uploadBase64(dto: UploadBase64Dto): Promise<{ url: string }> {
    const matches = dto.data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Invalid Base64 data URL format.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extension = mimeType.split('/')[1] || 'bin';
    const originalname = `upload.${extension}`;

    return this._uploadBuffer(buffer, originalname, mimeType, dto.category);
  }

  async uploadFromUrl(dto: UploadUrlDto): Promise<{ url: string }> {
    try {
      const response = await fetch(dto.url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch file from URL: ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType =
        response.headers.get('content-type') || 'application/octet-stream';
      const originalname =
        dto.url.substring(dto.url.lastIndexOf('/') + 1) || 'file';

      return this._uploadBuffer(buffer, originalname, mimeType, dto.category);
    } catch (error) {
      console.error('Error fetching file from URL:', error);
      throw new InternalServerErrorException(
        'Could not retrieve file from the provided URL.',
      );
    }
  }

  private async _uploadBuffer(
    buffer: Buffer,
    originalname: string,
    mimeType: string,
    category: AssetCategory,
  ): Promise<{ url: string }> {
    const fileExtension = originalname.split('.').pop() || 'bin';
    const fileKey = `${category}/${uuid()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
    });

    try {
      // This is the line that fixes the Vercel build error.
      await this.s3Client.send(command);
      const publicUrl = `${this.config.publicUrl}/${fileKey}`;
      return { url: publicUrl };
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new InternalServerErrorException('File upload to storage failed.');
    }
  }
}

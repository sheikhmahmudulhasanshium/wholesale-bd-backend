// src/storage/storage.service.ts

import {
  Injectable,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import r2Config from './r2.config';
import { UploadBase64Dto, UploadUrlDto } from '../uploads/dto/upload.dto';
import { AssetCategory } from '../uploads/enums/asset-category.enum';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;

  constructor(
    @Inject(r2Config.KEY)
    public readonly config: ConfigType<typeof r2Config>,
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

  async listFiles() {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucketName,
    });
    try {
      const response = await this.s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('Error listing files from R2:', error);
      throw new InternalServerErrorException(
        'Could not retrieve file list from storage.',
      );
    }
  }

  async getFileMetadata(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });
    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error: unknown) {
      // <-- Linter fix: explicitly type error
      // Linter fix: Check if error is an instance of Error before accessing properties
      if (
        error instanceof Error &&
        (error.name === 'NotFound' || error.name === 'NoSuchKey')
      ) {
        throw new NotFoundException(`File with key '${key}' not found.`);
      }
      console.error(`Error getting metadata for file ${key}:`, error);
      throw new InternalServerErrorException(
        'Could not retrieve file metadata.',
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });
    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Error deleting file ${key}:`, error);
      throw new InternalServerErrorException(
        'Could not delete file from storage.',
      );
    }
  }

  async replaceFile(
    key: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    try {
      await this.s3Client.send(command);
      const publicUrl = `${this.config.publicUrl}/${key}`;
      return { url: publicUrl };
    } catch (error) {
      console.error(`Error replacing file ${key}:`, error);
      throw new InternalServerErrorException(
        'File replacement in storage failed.',
      );
    }
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
      await this.s3Client.send(command);
      const publicUrl = `${this.config.publicUrl}/${fileKey}`;
      return { url: publicUrl };
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new InternalServerErrorException('File upload to storage failed.');
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { MediaType } from 'src/uploads/enums/media-type.enum'; // <-- ADDED: Import MediaType to use its enum values

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('r2.bucketName');
    this.publicUrl = this.configService.getOrThrow<string>('r2.publicUrl');

    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('r2.endpoint'),
      region: 'auto',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('r2.accessKeyId'),
        secretAccessKey:
          this.configService.getOrThrow<string>('r2.secretAccessKey'),
      },
    });

    this.logger.log('StorageService initialized');
  }

  async uploadFile(
    file: Express.Multer.File,
    entityType: string,
    mediaType: MediaType, // <-- MODIFIED: Accept mediaType as a parameter
  ): Promise<{ url: string; fileKey: string }> {
    const extension = path.extname(file.originalname);
    const uniqueId = uuidv4();

    // <-- MODIFIED: The fileKey now includes a folder for the media type.
    // We use `${mediaType}s` to create plural folder names (e.g., 'images', 'videos').
    const mediaTypeFolder = `${mediaType}s`;
    const fileKey = `${entityType}/${mediaTypeFolder}/${uniqueId}${extension}`;
    // Example result: "product/images/a1b2c3d4-e5f6-....jpg"

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    try {
      await this.s3Client.send(command);
      const url = `${this.publicUrl}/${fileKey}`;
      this.logger.log(`File uploaded successfully to ${url}`);
      return { url, fileKey };
    } catch (error) {
      this.logger.error('Error uploading file to R2', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error('Failed to upload file due to an unknown error.');
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Error deleting file from R2: ${fileKey}`, error);
    }
  }
}

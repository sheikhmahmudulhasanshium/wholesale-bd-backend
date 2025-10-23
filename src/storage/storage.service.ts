import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    // FIX 1: Use getOrThrow to ensure values are strings and not undefined.
    // This resolves all three TypeScript build errors.
    this.bucketName = this.configService.getOrThrow<string>('r2.bucketName');
    this.publicUrl = this.configService.getOrThrow<string>('r2.publicUrl');

    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('r2.endpoint'),
      region: 'auto', // R2 specific
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
  ): Promise<{ url: string; fileKey: string }> {
    const extension = path.extname(file.originalname);
    const uniqueId = uuidv4();
    const fileKey = `${entityType}/${uniqueId}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make the file publicly accessible
    });

    try {
      await this.s3Client.send(command);
      const url = `${this.publicUrl}/${fileKey}`;
      this.logger.log(`File uploaded successfully to ${url}`);
      return { url, fileKey };
    } catch (error) {
      this.logger.error('Error uploading file to R2', error);
      // FIX 2: Check if 'error' is an Error instance before accessing .message
      // This resolves the "@typescript-eslint/no-unsafe-member-access" linting error.
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
      // We don't throw an error here to prevent a failed media deletion
      // from rolling back a successful database record deletion.
    }
  }
}

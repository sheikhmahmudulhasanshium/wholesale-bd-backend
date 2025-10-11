// src/common/services/r2-upload.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class R2UploadService {
  private readonly logger = new Logger(R2UploadService.name);
  // FIX: Initialize as null to handle missing config
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', '');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (
      !endpoint ||
      !accessKeyId ||
      !secretAccessKey ||
      !this.bucketName ||
      !this.publicUrl
    ) {
      this.logger.error(
        'R2 configuration is incomplete. File uploads will fail.',
      );
      // If config is missing, s3Client remains null.
    } else {
      // Only create the client if config is present.
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // FIX: Add a guard clause to check if the client was initialized.
    if (!this.s3Client) {
      throw new BadRequestException('R2 service is not configured.');
    }
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });
    try {
      await this.s3Client.send(command);
      const url = `${this.publicUrl}/${fileName}`;
      this.logger.log(`File uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      this.logger.error('Error uploading file to R2:', error);
      throw new BadRequestException('Failed to upload file.');
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // FIX: Add a guard clause.
    if (!this.s3Client) {
      throw new BadRequestException('R2 service is not configured.');
    }
    const key = fileUrl.replace(`${this.publicUrl}/`, '');
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    try {
      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${fileUrl}`);
    } catch (error) {
      this.logger.error('Error deleting file from R2:', error);
      if (error instanceof Error) {
        if (error.name !== 'NotFound') {
          throw new BadRequestException('Failed to delete file.');
        }
      } else {
        throw new BadRequestException(
          'Failed to delete file due to an unknown error.',
        );
      }
    }
  }

  async fileExists(fileUrl: string): Promise<boolean> {
    // FIX: Add a guard clause.
    if (!this.s3Client) return false;
    const key = fileUrl.replace(`${this.publicUrl}/`, '');
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    try {
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

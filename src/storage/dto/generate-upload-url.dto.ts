import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  Max,
  IsIn,
} from 'class-validator';

// List of all supported MIME types for direct uploads
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

// Maximum file size (5MB in bytes)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export class GenerateUploadUrlDto {
  @ApiProperty({
    example: 'product-spec-sheet.pdf',
    description: 'The original name of the file to be uploaded.',
  })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({
    example: 'application/pdf',
    description: `The MIME type of the file. Supported types are images, documents, and presentations.`,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `Unsupported file type. Allowed types are: ${ALLOWED_MIME_TYPES.join(
      ', ',
    )}`,
  })
  mimeType: string;

  @ApiProperty({
    example: 1048576, // 1MB
    description: 'The size of the file in bytes. Maximum allowed size is 5MB.',
  })
  @IsNumber()
  @IsPositive()
  @Max(MAX_FILE_SIZE_BYTES, {
    message: `File size cannot exceed 5MB (${MAX_FILE_SIZE_BYTES} bytes).`,
  })
  size: number;

  @ApiProperty({
    required: false,
    example: 'A close-up shot of the new Samsung Galaxy phone.',
    description: 'Alternative text for accessibility.',
  })
  @IsString()
  @IsOptional()
  altText?: string;
}

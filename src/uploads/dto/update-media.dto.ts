// src/uploads/dto/update-media.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MediaPurpose } from '../enums/media-purpose.enum';

export class UpdateMediaDto {
  @ApiPropertyOptional({
    description: 'A new user-friendly name for the media file.',
    example: 'Main Product Image',
  })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiPropertyOptional({
    description: 'A detailed description or alt-text for the media.',
    example: 'A close-up of the product showing the texture.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The specific role or purpose of this media item.',
    enum: MediaPurpose,
    example: MediaPurpose.PRODUCT_THUMBNAIL,
  })
  @IsOptional()
  @IsEnum(MediaPurpose)
  purpose?: MediaPurpose;
}

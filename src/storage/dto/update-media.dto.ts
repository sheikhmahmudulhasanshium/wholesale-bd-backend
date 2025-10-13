import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({
    example: 'A beautiful close-up of the new product.',
    description: 'Alternative text for accessibility and SEO.',
  })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({
    example: 'Primary hero image for the product landing page.',
    description: 'A brief description of the media file or its purpose.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Samsung Galaxy A54 Official Photo',
    description: 'A user-friendly name for the media file.',
  })
  @IsString()
  @IsOptional()
  originalName?: string;
}

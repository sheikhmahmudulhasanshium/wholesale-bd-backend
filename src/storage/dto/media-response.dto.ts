// FILE: src/storage/dto/media-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({
    example: '668a7b4f7f8d9e1b2c3d4e5f',
    description: 'The unique ID of the media object.',
  })
  _id: string;

  @ApiProperty({
    example:
      'https://pub-your-id.r2.dev/c984fd25-3f8c-475f-891f-a914c7033585.jpg',
    description: 'The public URL to the media file.',
  })
  url: string;

  @ApiPropertyOptional({
    example: 'Front view of the Samsung Galaxy A54.',
    description: 'Alternative text for accessibility.',
  })
  altText?: string;

  @ApiPropertyOptional({
    example: 'image/jpeg',
    description: 'The MIME type of the file.',
  })
  mimeType?: string;
}

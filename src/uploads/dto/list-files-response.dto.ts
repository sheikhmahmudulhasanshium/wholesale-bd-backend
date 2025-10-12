// src/uploads/dto/list-files-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

class FileDetailDto {
  @ApiProperty({
    example: 'a65c3247-73b3-43a8-80e4-ad043f1eedc2.svg',
    description: 'The full filename in storage.',
  })
  filename: string;

  @ApiProperty({
    example:
      'https://pub-xyz.r2.dev/photo/a65c3247-73b3-43a8-80e4-ad043f1eedc2.svg',
    description: 'The public URL to access the file.',
  })
  url: string;

  @ApiProperty({
    example: '128x128',
    description:
      'Image dimensions (if available). Requires advanced metadata storage.',
    nullable: true,
    required: false,
  })
  dimensions?: string | null;

  @ApiProperty({
    example: 'Company Logo',
    description: 'Alt text for the image. Requires advanced metadata storage.',
    nullable: true,
    required: false,
  })
  alt?: string | null;

  @ApiProperty({
    example: 'Reusable item, will be used for metadata.',
    description: 'Additional details. Requires advanced metadata storage.',
    nullable: true,
    required: false,
  })
  details?: string | null;
}

class ImageGroupDto {
  @ApiProperty({ type: [FileDetailDto] })
  pngs: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  jpgs: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  svgs: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  gifs: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  webps: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  others: FileDetailDto[];
}

export class ListFilesResponseDto {
  @ApiProperty({ type: ImageGroupDto })
  images: ImageGroupDto;

  @ApiProperty({ type: [FileDetailDto] })
  videos: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  sounds: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  documents: FileDetailDto[];

  @ApiProperty({ type: [FileDetailDto] })
  others: FileDetailDto[];
}

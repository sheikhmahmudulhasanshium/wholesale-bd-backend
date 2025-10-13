import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class LinkExternalMediaDto {
  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description:
      'The full URL of the external media (e.g., YouTube, image link).',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 'Official Product Demo Video',
    description: 'A user-friendly name for this media link.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    example: 'Video demonstrating the key features of the new product.',
    description: 'A brief description of the linked media.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

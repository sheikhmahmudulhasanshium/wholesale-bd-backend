// src/products/dto/add-media-from-url.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class AddMediaFromUrlDto {
  @ApiProperty({
    description: 'The external URL of the image to add.',
    example: 'https://cdn.example.com/image.png',
  })
  @IsUrl({}, { message: 'A valid URL must be provided.' })
  @IsNotEmpty()
  url: string;
}

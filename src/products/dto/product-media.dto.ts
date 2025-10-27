// src/products/dto/product-media.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ProductMedia } from '../schemas/product.schema';
import { ProductMediaPurpose } from '../enums/product-media-purpose.enum';

export class ProductMediaDto {
  @ApiProperty({
    description: 'The unique ID of the media item.',
    example: '68f4529b0b588f71ad0fa1c1',
  })
  _id: string;

  @ApiProperty({
    description: 'The public URL of the media.',
    example: 'https://example.com/product.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'The specific purpose of this media.',
    enum: ProductMediaPurpose,
    example: ProductMediaPurpose.PREVIEW,
  })
  purpose: ProductMediaPurpose;

  @ApiProperty({
    description: 'The priority for sorting (lower numbers appear first).',
    example: 0,
  })
  priority: number;

  static fromSchema(media: ProductMedia): ProductMediaDto {
    const dto = new ProductMediaDto();
    dto._id = media._id.toHexString();
    dto.url = media.url;
    dto.purpose = media.purpose;
    dto.priority = media.priority;
    return dto;
  }
}

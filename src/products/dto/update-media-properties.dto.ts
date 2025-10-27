// src/products/dto/update-media-properties.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ProductMediaPurpose } from '../enums/product-media-purpose.enum';

export class UpdateMediaPropertiesDto {
  @ApiPropertyOptional({
    description: 'The new purpose for the media item.',
    enum: ProductMediaPurpose,
    example: ProductMediaPurpose.THUMBNAIL,
  })
  @IsOptional()
  @IsEnum(ProductMediaPurpose)
  purpose?: ProductMediaPurpose;

  @ApiPropertyOptional({
    description:
      'The priority for sorting preview images (lower numbers first).',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

// src/products/dto/public-product-response.dto.ts
import { OmitType } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class PublicProductResponseDto extends OmitType(ProductResponseDto, [
  'orderCount',
] as const) {}

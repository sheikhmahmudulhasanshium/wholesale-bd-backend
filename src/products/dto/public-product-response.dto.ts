// src/products/dto/public-product-response.dto.ts
import { OmitType } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

// This DTO inherits everything from ProductResponseDto but removes 'orderCount'.
// This is a clean, type-safe way to control data exposure for public endpoints.
export class PublicProductResponseDto extends OmitType(ProductResponseDto, [
  'orderCount',
] as const) {}

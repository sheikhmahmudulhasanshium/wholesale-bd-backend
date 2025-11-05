// src/carts/dto/cart-search-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Combined sorting options for both item-level and cart-level searches
export enum CartSearchSortByOption {
  // For User Search (Item Level)
  PRODUCT_NAME = 'productName',
  PRICE = 'price',
  SELLER_NAME = 'sellerName',
  WARNINGS = 'warnings',

  // For Admin Search (Cart Level)
  UPDATED_AT = 'updatedAt',
  TOTAL_VALUE = 'totalValue',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export enum SortOrderOption {
  ASC = 'asc',
  DESC = 'desc',
}

export class CartSearchQueryDto {
  @ApiPropertyOptional({
    description:
      'A search term to filter items by (for users) or carts by user name/email (for admins).',
    example: 'samsung',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      "Field to sort by. Options vary based on user role. Default for users is 'productName', for admins is 'updatedAt'.",
    enum: CartSearchSortByOption,
  })
  @IsOptional()
  @IsEnum(CartSearchSortByOption)
  sortBy?: CartSearchSortByOption;

  @ApiPropertyOptional({
    description:
      "Sort order. Default for users is 'asc', for admins is 'desc'.",
    enum: SortOrderOption,
  })
  @IsOptional()
  @IsEnum(SortOrderOption)
  sortOrder?: SortOrderOption;

  // --- Admin-only Pagination Parameters ---
  @ApiPropertyOptional({
    description: 'The page number to retrieve (Admin search only).',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'The number of items to return per page (Admin search only).',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

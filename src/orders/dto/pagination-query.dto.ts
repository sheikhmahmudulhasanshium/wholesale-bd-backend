// src/carts/dto/pagination-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum SortByCartOption {
  UPDATED_AT = 'updatedAt',
  TOTAL_VALUE = 'totalValue',
  STATUS = 'status', // <-- NEW OPTION
  CREATED_AT = 'createdAt', // <-- NEW OPTION
}

export enum SortOrderOption {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The page number to retrieve.',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'The number of items to return per page.',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: "Field to sort carts by. Default is 'updatedAt'.",
    enum: SortByCartOption,
    default: SortByCartOption.UPDATED_AT,
  })
  @IsOptional()
  @IsEnum(SortByCartOption)
  sortBy?: SortByCartOption;

  @ApiPropertyOptional({
    description: "Sort order. Default is 'desc'.",
    enum: SortOrderOption,
    default: SortOrderOption.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderOption)
  sortOrder?: SortOrderOption;
}

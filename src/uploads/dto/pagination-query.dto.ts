// src/shared/dto/pagination-query.dto.ts (Create this new file in a new 'shared/dto' directory)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The page number to retrieve.',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number) // Ensure the query param is converted to a number
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
}

// src/search/dto/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'The array of data items for the current page.',
  })
  data: T[];

  @ApiProperty({
    example: 100,
    description: 'The total number of items available.',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'The current page number.' })
  page: number;

  @ApiProperty({ example: 20, description: 'The number of items per page.' })
  limit: number;

  @ApiProperty({
    example: true,
    description: 'Indicates if there is a next page.',
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if there is a previous page.',
  })
  hasPrevPage: boolean;
}

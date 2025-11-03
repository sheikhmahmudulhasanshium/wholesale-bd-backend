// src/orders/dto/paginated-order-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class PaginatedOrderResponseDto {
  @ApiProperty({
    description: 'The array of order documents for the current page.',
    type: [OrderResponseDto],
  })
  data: OrderResponseDto[];

  @ApiProperty({ example: 100, description: 'The total number of orders.' })
  total: number;

  @ApiProperty({ example: 1, description: 'The current page number.' })
  page: number;

  @ApiProperty({ example: 10, description: 'The number of items per page.' })
  limit: number;

  @ApiProperty({ example: 10, description: 'The total number of pages.' })
  totalPages: number;
}

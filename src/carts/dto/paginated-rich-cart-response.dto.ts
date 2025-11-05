// src/carts/dto/paginated-rich-cart-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { RichCart } from '../cart.service';

export class PaginatedRichCartResponseDto {
  @ApiProperty({
    description: 'The array of rich cart data for the current page.',
    type: [Object], // In a real app, you would define a RichCartDto
  })
  data: RichCart[];

  @ApiProperty({ description: 'Total number of carts matching the query.' })
  total: number;

  @ApiProperty({ description: 'The current page number.' })
  page: number;

  @ApiProperty({ description: 'The number of items per page.' })
  limit: number;

  @ApiProperty({ description: 'The total number of pages available.' })
  totalPages: number;
}

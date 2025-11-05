import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CartUserDto {
  @ApiProperty({ example: '68f4529b0b588f71ad0fa1ac' })
  _id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;
}

class AdminCartItemDto {
  @ApiProperty({ example: '68f4529b0b588f71ad0fa1b7' })
  productId: string;

  @ApiProperty({ example: 100 })
  quantity: number;
}

export class AdminCartResponseDto {
  @ApiProperty({ example: '69f4a0ef3e2bde5f269a48' })
  _id: string;

  @ApiProperty({
    type: CartUserDto,
    description: 'The user who owns the cart.',
  })
  @Type(() => CartUserDto)
  userId: CartUserDto;

  @ApiProperty({
    type: [AdminCartItemDto],
    description: 'Raw list of items in the cart.',
  })
  @Type(() => AdminCartItemDto)
  items: AdminCartItemDto[];

  @ApiProperty({ example: '2025-10-19T08:58:48.807Z' })
  updatedAt: Date;

  // --- vvvvvv THIS IS THE FIX vvvvvv ---
  @ApiProperty({
    description: 'The calculated total value of all items in the cart.',
    example: 197500,
  })
  totalValue: number;
  // --- ^^^^^^ END OF FIX ^^^^^^ ---
}

export class PaginatedAdminCartResponseDto {
  @ApiProperty({
    description: 'The array of cart documents for the current page.',
    type: [AdminCartResponseDto],
  })
  data: AdminCartResponseDto[];

  @ApiProperty({
    example: 50,
    description: 'The total number of active carts.',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'The current page number.' })
  page: number;

  @ApiProperty({ example: 10, description: 'The number of items per page.' })
  limit: number;

  @ApiProperty({ example: 5, description: 'The total number of pages.' })
  totalPages: number;
}

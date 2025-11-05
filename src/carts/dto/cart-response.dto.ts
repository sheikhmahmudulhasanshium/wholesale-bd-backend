import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PublicProductResponseDto } from 'src/products/dto/public-product-response.dto';

class CartItemResponseDto {
  @ApiProperty({
    description: 'The full details of the product in the cart item.',
    type: PublicProductResponseDto,
  })
  @Type(() => PublicProductResponseDto)
  product: PublicProductResponseDto;

  @ApiProperty({
    description: 'The quantity of this product in the cart.',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'The price per unit for the specified quantity.',
    example: 43000,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'The total price for this line item (quantity * unitPrice).',
    example: 430000,
  })
  itemTotal: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the cart.',
    example: '69f1c4a0ef3e2bde5f269a48',
  })
  _id: string;

  @ApiProperty({
    description: 'The ID of the user who owns the cart.',
    example: '68f4529b0b588f71ad0fa1ac',
  })
  userId: string;

  @ApiProperty({
    description: 'An array of items currently in the cart.',
    type: [CartItemResponseDto],
  })
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'The total number of unique items in the cart.',
    example: 2,
  })
  totalUniqueItems: number;

  @ApiProperty({
    description: 'The sum total of all item quantities in the cart.',
    example: 12,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'The grand total price for all items in the cart.',
    example: 550000,
  })
  grandTotal: number;

  @ApiProperty({
    description: 'Timestamp when the cart was created.',
    example: '2025-10-19T02:53:15.683Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the cart was last updated.',
    example: '2025-10-19T08:58:48.807Z',
  })
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ProductInfo {
  @ApiProperty({ description: "The product's unique identifier." })
  productId: string;

  @ApiProperty({ description: "The product's name." })
  name: string;
}

class UserInfo {
  @ApiProperty({ description: "The user's unique identifier." })
  userId: string;

  @ApiProperty({ description: "The user's full name." })
  name: string;

  @ApiProperty({ description: "The user's email address." })
  email: string;
}

class CartItemInfo {
  @ApiProperty({ type: () => ProductInfo })
  @Type(() => ProductInfo)
  product: ProductInfo;

  @ApiProperty({ description: 'The quantity of the product in the cart.' })
  quantity: number;

  @ApiProperty({
    description:
      'The calculated total price for this line item (quantity * unit price).',
  })
  itemTotal: number;
}

export class SimpleCartResponseDto {
  @ApiProperty({ description: "The cart's unique identifier." })
  cartId: string;

  @ApiProperty({ type: () => UserInfo })
  @Type(() => UserInfo)
  user: UserInfo;

  @ApiProperty({
    type: [CartItemInfo],
    description: 'A list of items in the cart.',
  })
  @Type(() => CartItemInfo)
  items: CartItemInfo[];

  @ApiProperty({
    description: 'The total calculated value of all items in the cart.',
  })
  grandTotal: number;

  @ApiProperty({ description: 'The timestamp of the last update to the cart.' })
  lastUpdated: Date;
}

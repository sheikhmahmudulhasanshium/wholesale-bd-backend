// src/cart/dto/add-to-cart.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'The MongoDB ObjectId of the product to add.',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'The desired quantity of the product.',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

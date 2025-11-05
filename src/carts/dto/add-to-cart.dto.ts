// src/carts/dto/add-to-cart.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddCartItemDto {
  @ApiProperty({
    description: 'The ID of the product to add.',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;

  @ApiProperty({
    description:
      'The quantity of the product to add. If the item is already in the cart, this quantity will be added to the existing amount.',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity to add must be at least 1.' })
  quantity: number;
}

export class AddToCartDto {
  @ApiProperty({
    description: 'An array of items to add to the cart.',
    type: [AddCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}

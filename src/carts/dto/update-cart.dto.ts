// src/carts/dto/update-cart.dto.ts

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

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'The ID of the product to add or update.',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;

  @ApiProperty({
    description:
      'The new quantity for the product. A quantity of 0 will remove the item.',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class UpdateCartDto {
  @ApiProperty({
    description: 'An array of items to update in the cart.',
    type: [UpdateCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemDto)
  items: UpdateCartItemDto[];
}

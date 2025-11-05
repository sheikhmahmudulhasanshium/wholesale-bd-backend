// src/carts/dto/update-cart-status.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';
import { CartStatus } from '../schemas/cart.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartStatusDto {
  @ApiProperty({
    description: 'The new status for the cart.',
    enum: CartStatus,
    example: CartStatus.LOCKED,
  })
  @IsNotEmpty()
  @IsEnum(CartStatus)
  status: CartStatus;
}

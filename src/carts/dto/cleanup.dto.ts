// src/carts/dto/cleanup.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CleanupDto {
  @ApiProperty({
    description:
      'Confirmation phrase to proceed with the cleanup. Must be exactly "confirm-cart-cleanup".',
    example: 'confirm-cart-cleanup',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^confirm-cart-cleanup$/, {
    message: 'Confirmation must be exactly "confirm-cart-cleanup"',
  })
  confirmation: string;
}

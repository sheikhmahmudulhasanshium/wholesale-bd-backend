// src/carts/dto/update-shipping.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateShippingDto {
  @ApiPropertyOptional({
    description: 'The full shipping address.',
    example: '123 Kazi Nazrul Islam Ave, Dhaka 1215',
  })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  shippingAddress?: string;

  @ApiPropertyOptional({
    description: 'The contact phone number for the delivery.',
    example: '+8801712345678',
  })
  @IsOptional()
  @IsString()
  @Length(11, 15)
  contactPhone?: string;
}

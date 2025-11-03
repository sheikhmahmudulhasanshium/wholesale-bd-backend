// src/orders/dto/order-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '../schemas/order.schema';

class OrderItemDto {
  @ApiProperty({ example: '68f4529b0b588f71ad0fa1b7' })
  productId: string;

  @ApiProperty({ example: 'Premium Cotton T-Shirts' })
  productName: string;

  @ApiProperty({ example: 'CW-CT100-MIX' })
  productSku?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiProperty({ example: 400 })
  pricePerUnitAtOrder: number;

  @ApiProperty({ example: 40000 })
  totalPrice: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: '123 Main St, Apt 4B' })
  addressLine?: string;

  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @ApiProperty({ example: 'Dhaka' })
  zone: string;

  @ApiProperty({ example: '+8801234567890' })
  phone?: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: '69f1c4a0ef3e2bde5f269a48' })
  _id: string;

  @ApiProperty({ example: 'WBD-2024-001' })
  orderNumber: string;

  @ApiProperty({ example: '68f4529b0b588f71ad0fa1ac' })
  userId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 40000 })
  totalAmount: number;

  @ApiProperty({ type: ShippingAddressDto })
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING_APPROVAL })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 'Awaiting stock confirmation from seller.' })
  adminNotes?: string;

  @ApiProperty({ example: '2024-02-15T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-15T00:00:00.000Z' })
  updatedAt: Date;
}

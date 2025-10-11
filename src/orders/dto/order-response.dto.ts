import { ApiProperty } from '@nestjs/swagger';
import {
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from '../schemas/order.schema';

class OrderItemDto {
  @ApiProperty({ example: '65f1c5a0ef3e2bde5f269b58' })
  productId: string;

  @ApiProperty({ example: 'High-Quality T-Shirt' })
  productName: string;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({ example: 150.5 })
  pricePerUnit: number;

  @ApiProperty({ example: 1505.0 })
  totalPrice: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @ApiProperty({ example: 'Dhaka Division' })
  zone: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: '65f1d8a0ef3e2bde5f269c12' })
  _id: string;

  @ApiProperty({ example: 'WBD-20240315-0001' })
  orderNumber: string;

  @ApiProperty({ example: '65f1c4a0ef3e2bde5f269a47' })
  customerId: string;

  @ApiProperty({ example: '65f1c4a0ef3e2bde5f269a49' })
  sellerId: string;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ example: 1655.0 })
  totalAmount: number;

  @ApiProperty()
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: OrderStatus.PENDING, enum: OrderStatus })
  status: string;

  @ApiProperty({ example: PaymentStatus.PENDING, enum: PaymentStatus })
  paymentStatus: string;

  @ApiProperty()
  createdAt: Date;

  static fromOrderDocument(orderDoc: OrderDocument): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto._id = orderDoc._id.toString();
    dto.orderNumber = orderDoc.orderNumber;
    dto.customerId = orderDoc.customerId;
    dto.sellerId = orderDoc.sellerId;
    dto.items = orderDoc.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice,
    }));
    dto.totalAmount = orderDoc.totalAmount;
    dto.shippingAddress = {
      fullName: orderDoc.shippingAddress.fullName,
      city: orderDoc.shippingAddress.city,
      zone: orderDoc.shippingAddress.zone,
    };
    dto.status = orderDoc.status;
    dto.paymentStatus = orderDoc.paymentStatus;
    dto.createdAt = orderDoc.createdAt;
    return dto;
  }
}

import { OrderDocument } from '../schemas/order.schema';

// This DTO defines the shape of an order object when sent in an API response.
export class OrderResponseDto {
  _id: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    city: string;
    zone: string;
  };
  status: string;
  paymentStatus: string;
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

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  // IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// --- FULLY AND CORRECTLY DECORATED DTOs TO MATCH seeder.html ---
class CustomerDto {
  @IsString() _id: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() role: string;
}
class ReviewDto {
  @IsString() reviewId: string;
  @IsNumber() rating: number;
  @IsString() comment: string;
  @IsString() submittedAt: string;
}
class OrderItemDto {
  @IsString() productId: string;
  @IsString() productName: string;
  @IsNumber() quantity: number;
  @IsNumber() pricePerUnitAtOrder: number;
  @IsNumber() totalPrice: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewDto)
  review?: ReviewDto | null;
}
class TaxDto {
  @IsNumber() ratePercentage: number;
  @IsNumber() amount: number;
}
class DiscountDto {
  @IsOptional() @IsString() code: string | null;
  @IsNumber() amount: number;
}
class PlatformFeeDto {
  @IsNumber() ratePercentage: number;
  @IsNumber() amount: number;
}
class FinancialsDto {
  @IsNumber() subtotal: number;
  @IsNumber() shippingFee: number;
  @ValidateNested() @Type(() => TaxDto) tax: TaxDto;
  @ValidateNested() @Type(() => DiscountDto) discount: DiscountDto;
  @IsNumber() grandTotal: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformFeeDto)
  platformFee?: PlatformFeeDto | null;
  @IsOptional() @IsNumber() sellerPayout?: number | null;
}
class ShippingAddressDto {
  @IsString() fullName: string;
  @IsString() addressLine: string;
  @IsString() city: string;
  @IsString() zone: string;
  @IsString() phone: string;
}
class DeliveryDetailsDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
  @IsOptional() @IsString() courier?: string | null;
  @IsOptional() @IsString() trackingNumber?: string | null;
  @IsOptional() @IsString() shippedAt?: string | null;
  @IsOptional() @IsString() deliveredAt?: string | null;
}
class PaymentDetailsDto {
  @IsString() status: string;
  @IsString() method: string;
  @IsString() type: string;
  @IsOptional() @IsString() transactionId: string | null;
  @IsOptional() @IsString() paidAt: string | null;
}
class NotesDto {
  @IsOptional() @IsString() adminNote: string | null;
  @IsOptional() @IsString() customerNote?: string | null;
}
class SellerDto {
  @IsString() _id: string;
  @IsString() businessName: string;
  @IsBoolean() isTrustedUser: boolean;
}
class StatusHistoryDto {
  @IsString() status: string;
  @IsString() timestamp: string;
  @IsString() updatedBy: string;
  @IsString() notes: string;
}
class RefundItemDto {
  @IsString() productId: string;
  @IsNumber() quantity: number;
}
class RefundDetailsDto {
  @IsString() status: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  items: RefundItemDto[];
  @IsOptional() @IsString() reason: string | null;
  @IsNumber() refundedAmount: number;
  @IsOptional() @IsString() processedAt: string | null;
}
class SellerServiceReviewDto {
  @IsString() reviewId: string;
  @IsNumber() rating: number;
  @IsString() comment: string;
  @IsString() submittedAt: string;
}

class OrderSampleDto {
  @IsString() _id: string;
  @IsString() orderNumber: string;
  @IsString() createdAt: string;
  @IsString() updatedAt: string;
  @IsString() status: string;
  @IsOptional() @IsString() order_scenario?: string;
  @IsBoolean() isTestData: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatusHistoryDto)
  statusHistory: StatusHistoryDto[];
  @ValidateNested() @Type(() => CustomerDto) customer: CustomerDto;
  @ValidateNested() @Type(() => SellerDto) seller: SellerDto;
  @ValidateNested() @Type(() => FinancialsDto) financials: FinancialsDto;
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
  @IsOptional()
  @ValidateNested()
  @Type(() => SellerServiceReviewDto)
  sellerServiceReview?: SellerServiceReviewDto | null;
  @ValidateNested()
  @Type(() => DeliveryDetailsDto)
  deliveryDetails: DeliveryDetailsDto;
  @ValidateNested()
  @Type(() => RefundDetailsDto)
  refundDetails: RefundDetailsDto;
  @ValidateNested() @Type(() => NotesDto) notes: NotesDto;
}

export class SeedOrdersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderSampleDto)
  data: OrderSampleDto[];
}

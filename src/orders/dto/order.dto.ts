import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsMongoId,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty()
  @IsMongoId()
  readonly productId: string;
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  readonly quantity: number;
}

class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  readonly fullName: string;
  @ApiProperty()
  @IsString()
  readonly phone: string;
  @ApiProperty()
  @IsString()
  readonly address: string;
  @ApiProperty()
  @IsString()
  readonly city: string;
  @ApiProperty()
  @IsString()
  readonly zone: string;
  @ApiProperty()
  @IsString()
  readonly postalCode: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly items: OrderItemDto[];
  @ApiProperty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  readonly shippingAddress: ShippingAddressDto;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly notes?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly paymentMethod?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [
      'pending',
      'confirmed',
      'processing',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
      'cancelled',
      'rejected',
    ],
  })
  @IsEnum([
    'pending',
    'confirmed',
    'processing',
    'ready_for_dispatch',
    'dispatched',
    'delivered',
    'cancelled',
    'rejected',
  ])
  readonly status: string;
}

export class SellerOrderActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly notes?: string;
}

export class SellerRejectOrderDto {
  @ApiProperty()
  @IsString()
  readonly reason: string;
}

export class AdminDispatchOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly trackingNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  readonly estimatedDeliveryDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly notes?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  readonly customerId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  readonly sellerId?: string;
  @ApiPropertyOptional({
    enum: [
      'pending',
      'confirmed',
      'processing',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
      'cancelled',
      'rejected',
    ],
  })
  @IsOptional()
  @IsString()
  readonly status?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly page?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly limit?: string;
}

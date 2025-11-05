import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  //IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// --- FULLY AND CORRECTLY DECORATED DTOs TO MATCH seeder.html ---
class ProductIdDto {
  @IsString() _id: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
}
class PricingDto {
  @IsNumber() unitPrice: number;
  @IsNumber() itemTotal: number;
}
class CartItemDto {
  @ValidateNested() @Type(() => ProductIdDto) product: ProductIdDto;
  @IsNumber() quantity: number;
  @IsOptional() @ValidateNested() @Type(() => PricingDto) pricing?: PricingDto;
  @IsOptional() @IsArray() warnings?: string[];
}
class SellerDto {
  @IsString() _id: string;
  @IsOptional() @IsString() businessName?: string;
}
class SellerItemGroupDto {
  @ValidateNested() @Type(() => SellerDto) seller: SellerDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
  @IsOptional() @IsNumber() subtotal?: number;
}
class UserIdDto {
  @IsString() _id: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() role?: string;
}
class SummaryDto {
  @IsNumber() totalUniqueItems: number;
  @IsNumber() totalQuantity: number;
  @IsNumber() grandTotal: number;
}

export class SeedCartsDto {
  @IsString() _id: string;
  @IsString() updatedAt: string;
  @ValidateNested() @Type(() => UserIdDto) user: UserIdDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerItemGroupDto)
  itemsBySeller: SellerItemGroupDto[];
  @IsOptional() @IsString() cart_scenario?: string;
  @IsOptional() @ValidateNested() @Type(() => SummaryDto) summary?: SummaryDto;
}

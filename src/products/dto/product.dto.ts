import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsMongoId,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricingTierDto {
  @ApiProperty({ description: 'Minimum quantity for this pricing tier' })
  @IsNumber()
  @Min(1)
  readonly minQuantity: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity for this pricing tier',
  })
  @IsOptional()
  @IsNumber()
  readonly maxQuantity?: number;

  @ApiProperty({ description: 'Price per unit in BDT for this tier' })
  @IsNumber()
  @Min(0)
  readonly pricePerUnit: number;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  readonly name: string;
  @ApiProperty({ description: 'Product description' })
  @IsString()
  readonly description: string;
  @ApiProperty()
  @IsMongoId()
  readonly categoryId: string;
  @ApiProperty()
  @IsMongoId()
  readonly zoneId: string;
  @ApiProperty({ type: [PricingTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  readonly pricingTiers: PricingTierDto[];
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  readonly minimumOrderQuantity: number;
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly stockQuantity: number;
  @ApiProperty()
  @IsString()
  readonly unit: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly brand?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly sku?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  readonly name?: string;
  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  readonly description?: string;
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsMongoId()
  readonly categoryId?: string;
  @ApiPropertyOptional({ description: 'Zone ID' })
  @IsOptional()
  @IsMongoId()
  readonly zoneId?: string;
  @ApiPropertyOptional({ type: [PricingTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  readonly pricingTiers?: PricingTierDto[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  readonly minimumOrderQuantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly stockQuantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly unit?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly brand?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly sku?: string;
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'out_of_stock'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'out_of_stock'])
  readonly status?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
  @ApiPropertyOptional({ description: 'Existing image URLs to keep' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly existingImages?: string[];
}

export class ProductQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for product name/description',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;
  @ApiPropertyOptional({ description: 'Category ID filter' })
  @IsOptional()
  @IsMongoId()
  readonly categoryId?: string;
  @ApiPropertyOptional({ description: 'Zone ID filter' })
  @IsOptional()
  @IsMongoId()
  readonly zoneId?: string;
  @ApiPropertyOptional({ description: 'Seller ID filter' })
  @IsOptional()
  @IsMongoId()
  readonly sellerId?: string;
  @ApiPropertyOptional({ enum: ['name', 'price', 'createdAt'] })
  @IsOptional()
  @IsString()
  readonly sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  readonly sortOrder?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly page?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly limit?: string;
}

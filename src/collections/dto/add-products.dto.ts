// src/collections/dto/add-products.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CollectionProductDto } from './collection-product.dto';

export class AddProductsDto {
  @ApiProperty({
    description: 'An array of products to add to the collection.',
    type: [CollectionProductDto],
    example: [{ productId: '68f4529b0b588f71ad0fa1ae', priority: 3 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1) // You must add at least one product
  @Type(() => CollectionProductDto)
  products: CollectionProductDto[];
}

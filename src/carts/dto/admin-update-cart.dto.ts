import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'The MongoDB ObjectId of the product.',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description:
      'The new quantity for the product. A quantity of 0 will remove the item from the cart.',
    example: 5,
    minimum: 0,
  })
  @IsInt()
  @Min(0) // Allow 0 for item removal
  quantity: number;
}

export class AdminUpdateCartDto {
  @ApiProperty({
    description:
      'An array of items to add, update, or remove. For removal, set quantity to 0.',
    type: [UpdateCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemDto)
  items: UpdateCartItemDto[];
}

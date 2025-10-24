// collection-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CollectionProductDto {
  @ApiProperty({
    description: 'The MongoDB ObjectId of the product.',
    example: '68f4529b0b588f71ad0fa1b2',
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'The display priority of the product within this collection.',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  priority: number;
}

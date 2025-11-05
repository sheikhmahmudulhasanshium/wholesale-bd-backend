import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AdminCreateOrderDto {
  @ApiProperty({
    description:
      'The MongoDB ObjectId of the cart that will be converted into an order.',
    example: '68f4529b0b588f71ad0fa1d1',
  })
  @IsMongoId()
  cartId: string;
}

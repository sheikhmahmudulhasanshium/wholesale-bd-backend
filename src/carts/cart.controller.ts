// src/carts/cart.controller.ts

import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartService, RichCart } from './cart.service';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all carts with full details' })
  @ApiResponse({
    status: 200,
    description: 'An array of all cart documents, enriched with details.',
    type: Object,
  })
  async getAllCarts(): Promise<RichCart[]> {
    return this.cartService.getAllCartsRich();
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update the status of a cart (e.g., lock for checkout)',
  })
  @ApiParam({ name: 'id', description: 'The ID of the cart', type: String })
  @ApiResponse({
    status: 200,
    description: 'The cart status has been successfully updated.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Cart not found.' })
  @ApiResponse({ status: 400, description: 'Invalid status value provided.' })
  async updateCartStatus(
    @Param('id') id: string,
    @Body() updateCartStatusDto: UpdateCartStatusDto,
  ): Promise<RichCart> {
    return await this.cartService.updateCartStatus(id, updateCartStatusDto);
  }
}

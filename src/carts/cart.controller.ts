// src/cart/cart.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse, // --- V NEW ---
} from '@nestjs/swagger';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginatedAdminCartResponseDto } from './dto/admin-cart-response.dto';
import { PaginationQueryDto } from 'src/uploads/dto/pagination-query.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active carts (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all carts with pagination.',
    type: PaginatedAdminCartResponseDto,
  })
  async findAllAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedAdminCartResponseDto> {
    return this.cartService.findAllAdmin(paginationQuery);
  }

  @Get()
  @ApiOperation({ summary: "Get the current user's shopping cart" })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the cart.',
    type: CartResponseDto,
  })
  async getCart(@CurrentUser() user: UserDocument): Promise<CartResponseDto> {
    return this.cartService.getCart(user._id);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add an item to the cart or update its quantity',
  })
  @ApiResponse({
    status: 200,
    description: 'Item successfully added/updated in the cart.',
    type: CartResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data (e.g., quantity below minimum).',
  })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  // --- V NEW: Add Swagger documentation for the Forbidden error ---
  @ApiForbiddenResponse({
    description: 'Admins are not allowed to perform this action.',
  })
  // --- V MODIFIED: Pass the full user object to the service ---
  async addItem(
    @CurrentUser() user: UserDocument,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user, addToCartDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove a specific item from the cart' })
  @ApiResponse({
    status: 200,
    description: 'Item successfully removed from the cart.',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cart or item in cart not found.' })
  @ApiBadRequestResponse({ description: 'Invalid product ID format.' })
  async removeItem(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user._id, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from the shopping cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart has been successfully cleared.',
    type: CartResponseDto,
  })
  async clearCart(@CurrentUser() user: UserDocument): Promise<CartResponseDto> {
    return this.cartService.clearCart(user._id);
  }
}

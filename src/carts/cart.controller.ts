// src/carts/cart.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Delete,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService, RichCart, SearchableCartItem } from './cart.service';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { CleanupDto } from './dto/cleanup.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartSearchQueryDto } from './dto/cart-search-query.dto';
import { PaginatedRichCartResponseDto } from './dto/paginated-rich-cart-response.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('public/count')
  @Public()
  @ApiOperation({
    summary: 'Get the total number of active carts for public display',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of active carts.',
  })
  async getActiveCartsCount(): Promise<{ totalActiveCarts: number }> {
    return await this.cartService.countActiveCarts();
  }

  @Get('count/all')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the total count of all carts in the system (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the total count of all carts.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getTotalCartsCount(): Promise<{ totalCarts: number }> {
    return await this.cartService.countAllCarts();
  }

  @Post('maintenance/cleanup')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run data cleanup tasks for carts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cleanup task completed. Returns a summary of actions taken.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async runCleanupTasks(@Body() cleanupDto: CleanupDto): Promise<object> {
    return await this.cartService.runCleanupTasks(cleanupDto.confirmation);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search within carts (functionality varies by user role)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns a list of items for users, or a paginated list of carts for admins.',
  })
  async searchCarts(
    @CurrentUser() user: UserDocument,
    @Query() query: CartSearchQueryDto,
  ): Promise<PaginatedRichCartResponseDto | SearchableCartItem[]> {
    return await this.cartService.searchCarts(user, query);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the current user's cart (creates one if it doesn't exist)",
  })
  @ApiResponse({
    status: 200,
    description: "The user's cart, enriched with details.",
  })
  async getMyCart(@CurrentUser() user: UserDocument): Promise<RichCart> {
    return await this.cartService.getCartForUser(user);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all carts in the system (Admin only)' })
  @ApiResponse({ status: 200, description: 'An array of all cart documents.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getAllCarts(): Promise<RichCart[]> {
    return await this.cartService.getAllCartsRich();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific cart by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the cart to retrieve.' })
  @ApiResponse({ status: 200, description: 'The requested cart details.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User does not own this cart.',
  })
  @ApiResponse({ status: 404, description: 'Cart not found.' })
  async getCartById(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ): Promise<RichCart> {
    return await this.cartService.getCartById(user, id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Add one or more items to the cart (increments quantity if item exists)',
  })
  @ApiResponse({
    status: 201,
    description:
      'The item(s) were added successfully and the updated cart is returned.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request (e.g., product does not exist or quantity is invalid).',
  })
  async addItemsToCart(
    @CurrentUser() user: UserDocument,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<RichCart> {
    return await this.cartService.addItemsToCart(user, addToCartDto);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set quantities or remove items in the cart' })
  @ApiResponse({
    status: 200,
    description: 'The cart was updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., product does not exist).',
  })
  async updateCartItems(
    @CurrentUser() user: UserDocument,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<RichCart> {
    return await this.cartService.updateCart(user, updateCartDto);
  }

  @Patch('shipping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update the cart's shipping information" })
  @ApiResponse({
    status: 200,
    description: 'Shipping details updated successfully.',
  })
  async updateShippingInfo(
    @CurrentUser() user: UserDocument,
    @Body() updateShippingDto: UpdateShippingDto,
  ): Promise<RichCart> {
    return await this.cartService.updateShippingInfo(user, updateShippingDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of a cart' })
  @ApiParam({ name: 'id', description: 'The ID of the cart', type: String })
  @ApiResponse({
    status: 200,
    description: 'The cart status has been successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User does not own this cart.',
  })
  @ApiResponse({ status: 404, description: 'Cart not found.' })
  async updateCartStatus(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() updateCartStatusDto: UpdateCartStatusDto,
  ): Promise<RichCart> {
    return await this.cartService.updateCartStatus(
      user,
      id,
      updateCartStatusDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a cart' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the cart to delete',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The cart has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User does not own this cart.',
  })
  @ApiResponse({ status: 404, description: 'Cart not found.' })
  async deleteCart(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.cartService.deleteCart(user, id);
  }
}

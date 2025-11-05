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
  Patch,
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
  ApiExcludeEndpoint,
  ApiBody,
} from '@nestjs/swagger';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginatedAdminCartResponseDto } from './dto/admin-cart-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { SeedCartsDto } from './dto/seed-carts.dto';
import { AdminUpdateCartDto } from './dto/admin-update-cart.dto';
import { PaginationQueryDto } from 'src/carts/dto/pagination-query.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiExcludeEndpoint()
  @Public()
  @Get('internal_migration/:password')
  async wipeCarts(@Param('password') password: string) {
    return this.cartService.runOneTimeWipe(password);
  }

  @ApiExcludeEndpoint()
  @Public()
  @Post('internal_migration/seed/:password')
  @ApiBody({
    description: 'The raw JSON array of cart objects to seed.',
    type: [SeedCartsDto],
  })
  async seedCarts(
    @Param('password') password: string,
    @Body() seedCartsDto: SeedCartsDto[],
  ) {
    return this.cartService.runOneTimeSeed(password, seedCartsDto);
  }

  @Public()
  @Get('public/count')
  @ApiOperation({ summary: 'Get the total number of active carts' })
  async getActiveCartsCount() {
    return this.cartService.getActiveCartsCount();
  }

  @Patch('admin/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      "Update a user's cart (add, update quantity, or remove items) (Admin Only)",
  })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiNotFoundResponse({ description: 'User or Product not found.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  async adminUpdateCart(
    @Param('userId') userId: string,
    @Body() adminUpdateCartDto: AdminUpdateCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.adminUpdateCart(userId, adminUpdateCartDto.items);
  }

  @Get('admin/find/:cartId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find a specific cart by its ID (Admin Only)' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiNotFoundResponse({ description: 'Cart with the specified ID not found.' })
  @ApiBadRequestResponse({ description: 'Invalid Cart ID format.' })
  async findCartById(
    @Param('cartId') cartId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.findCartById(cartId);
  }

  @Get('admin/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get a specific user's cart by their User ID (Admin Only)",
  })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiNotFoundResponse({ description: 'User or their cart not found.' })
  async getCartByUserId(
    @Param('userId') userId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.getCart(userId);
  }

  @Delete('admin/clear/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Clear all items from a specific user's cart (Admin Only)",
  })
  async adminClearCart(
    @Param('userId') userId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.clearCart(userId);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active carts with sorting (Admin Only)' })
  async findAllAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedAdminCartResponseDto> {
    return this.cartService.findAllAdmin(paginationQuery);
  }

  // --- vvvvvv THIS IS THE FIX vvvvvv ---
  @Public() // Make this endpoint accessible without a JWT token
  @Get('admin/all/raw')
  @ApiOperation({
    summary:
      'Get all active carts as raw DB documents (Public for Verification)',
  })
  async findAllAdminRaw() {
    return this.cartService.findAllAdminRaw();
  }
  // --- ^^^^^^ END OF FIX ^^^^^^ ---

  @Get()
  @ApiOperation({ summary: "Get the current user's personal shopping cart" })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@CurrentUser() user: UserDocument): Promise<CartResponseDto> {
    return this.cartService.getCart(user._id);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add an item to the personal cart or update its quantity',
  })
  async addItem(
    @CurrentUser() user: UserDocument,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user, addToCartDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove a specific item from the personal cart' })
  async removeItem(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user._id, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from the personal shopping cart' })
  async clearCart(@CurrentUser() user: UserDocument): Promise<CartResponseDto> {
    return this.cartService.clearCart(user._id);
  }
}

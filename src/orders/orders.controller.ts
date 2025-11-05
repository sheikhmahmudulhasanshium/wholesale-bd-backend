import {
  Controller,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiExcludeEndpoint,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginatedOrderResponseDto } from './dto/paginated-order-response.dto';
import { AdminCreateOrderDto } from './dto/admin-create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { SeedOrdersDto } from './dto/seed-orders.dto';
import { PaginationQueryDto } from 'src/orders/dto/pagination-query.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiExcludeEndpoint()
  @Public()
  @Get('internal_migration/:password')
  async wipeOrders(@Param('password') password: string) {
    return this.ordersService.runOneTimeWipe(password);
  }

  @ApiExcludeEndpoint()
  @Public()
  @Post('internal_migration/seed/:password')
  @ApiBody({
    description: 'The raw JSON payload of orders to seed.',
    type: SeedOrdersDto,
  })
  async seedOrders(
    @Param('password') password: string,
    @Body() seedOrdersDto: SeedOrdersDto,
  ) {
    return this.ordersService.runOneTimeSeed(password, seedOrdersDto);
  }

  @Public()
  @Get('public/analytics')
  @ApiOperation({ summary: 'Get public order analytics (counts)' })
  async getOrderAnalytics() {
    return this.ordersService.getOrderAnalytics();
  }

  @Post('admin/create-from-cart')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an order from a specific cart ID (Admin Only)',
  })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created from the cart.',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cart is empty or invalid.' })
  @ApiNotFoundResponse({ description: 'Cart or User not found.' })
  async adminCreateOrderFromCart(
    @Body() adminCreateOrderDto: AdminCreateOrderDto,
  ): Promise<OrderResponseDto> {
    // --- THIS IS THE FIX ---
    return this.ordersService.createOrderFromCart(adminCreateOrderDto.cartId);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin Only)' })
  @ApiResponse({ status: 200, type: PaginatedOrderResponseDto })
  async findAllAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.ordersService.findAllAdmin(paginationQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new order from the user's current cart" })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiBadRequestResponse({
    description: 'Cart is empty or contains invalid items.',
  })
  async createOrderFromCart(
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto> {
    // This finds the cart by the logged-in user's ID
    return this.ordersService.createOrderFromCart(user._id);
  }

  @Get()
  @ApiOperation({ summary: "Get the current user's order history" })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async findAllForUser(
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findAllForUser(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by its ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Invalid order ID format.' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOneForUser(id, user._id);
  }
}

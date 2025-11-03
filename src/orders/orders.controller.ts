// src/orders/orders.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { OrderResponseDto } from './dto/order-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationQueryDto } from 'src/uploads/dto/pagination-query.dto';
import { PaginatedOrderResponseDto } from './dto/paginated-order-response.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- V NEW: Admin endpoint to get all orders ---
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all orders with pagination.',
    type: PaginatedOrderResponseDto,
  })
  async findAllAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.ordersService.findAllAdmin(paginationQuery);
  }
  // --- ^ END of NEW ---

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new order from the user's current cart",
    description:
      "This action takes all items from the user's cart, creates a formal order, and then clears the cart.",
  })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Cart is empty or contains invalid items.',
  })
  async createOrderFromCart(
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrderFromCart(user._id);
  }

  @Get()
  @ApiOperation({ summary: "Get the current user's order history" })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved order history.',
    type: [OrderResponseDto],
  })
  async findAllForUser(
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findAllForUser(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by its ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the order.',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Invalid order ID format.' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOneForUser(id, user._id);
  }
}

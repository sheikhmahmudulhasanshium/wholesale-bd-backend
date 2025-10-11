import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SellerApprovalGuard } from '../auth/guards/seller-approval.guard';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order (Customer only)' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.create(createOrderDto, user._id.toString());
  }

  @Get('my-orders')
  @ApiOperation({
    summary: 'Get orders for the logged-in user (Customer or Seller)',
  })
  getMyOrders(
    @CurrentUser() user: UserDocument,
    @Query() query: OrderQueryDto,
  ) {
    // FIX: Cast user.role to Role for safe comparison
    const filter =
      (user.role as Role) === Role.SELLER
        ? { sellerId: user._id.toString() }
        : { customerId: user._id.toString() };
    return this.ordersService.findAll({ ...query, ...filter });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const order = await this.ordersService.findOne(id);

    // FIX: Cast user.role to Role for safe comparison
    if (
      (user.role as Role) !== Role.ADMIN &&
      order.customerId.toString() !== user._id.toString() &&
      order.sellerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this order.',
      );
    }
    return order;
  }

  @Patch('seller/:id/confirm')
  @UseGuards(RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Confirm an order (Seller only)' })
  confirmOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'confirmed',
      user._id.toString(),
      user.role,
    );
  }

  @Patch('seller/:id/reject')
  @UseGuards(RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Reject an order (Seller only)' })
  rejectOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'rejected',
      user._id.toString(),
      user.role,
    );
  }

  @Patch('seller/:id/ready')
  @UseGuards(RolesGuard, SellerApprovalGuard)
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Mark order as ready for dispatch (Seller only)' })
  markAsReady(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'ready_for_dispatch',
      user._id.toString(),
      user.role,
    );
  }

  @Patch('admin/:id/dispatch')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Dispatch an order (Admin only)' })
  dispatchOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'dispatched',
      user._id.toString(),
      user.role,
    );
  }

  @Patch('admin/:id/deliver')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mark an order as delivered (Admin only)' })
  deliverOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'delivered',
      user._id.toString(),
      user.role,
    );
  }

  @Patch('customer/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cancel an order (Customer only)' })
  cancelOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.updateStatus(
      id,
      'cancelled',
      user._id.toString(),
      user.role,
    );
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders with filtering (Admin only)' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }
}

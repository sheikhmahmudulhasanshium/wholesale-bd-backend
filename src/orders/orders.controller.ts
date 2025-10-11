import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- NEW ANALYTICS ENDPOINT ---
  @Get('analytics')
  @ApiOperation({ summary: 'Get aggregated order statistics' })
  async getOrderAnalytics(): Promise<{
    total: number;
    pending: number;
    delivered: number;
  }> {
    return this.ordersService.getAnalytics();
  }

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of orders' })
  async getOrderCount(): Promise<{ totalOrders: number }> {
    const count = await this.ordersService.countAll();
    return { totalOrders: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all orders' })
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll();
    return orders.map((order) => OrderResponseDto.fromOrderDocument(order));
  }
}

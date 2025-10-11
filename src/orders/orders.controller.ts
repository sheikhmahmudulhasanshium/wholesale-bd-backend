import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get aggregated order statistics' })
  @ApiOkResponse({
    description: 'Returns a summary of order counts by status.',
    schema: {
      example: {
        total: 1500,
        pending: 75,
        delivered: 1200,
      },
    },
  })
  async getOrderAnalytics(): Promise<{
    total: number;
    pending: number;
    delivered: number;
  }> {
    return this.ordersService.getAnalytics();
  }

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of orders' })
  @ApiOkResponse({
    description: 'Returns the total count of all orders.',
    schema: { example: { totalOrders: 1500 } },
  })
  async getOrderCount(): Promise<{ totalOrders: number }> {
    const count = await this.ordersService.countAll();
    return { totalOrders: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all orders' })
  @ApiOkResponse({
    description: 'An array of order records.',
    type: [OrderResponseDto],
  })
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll();
    return orders.map((order) => OrderResponseDto.fromOrderDocument(order));
  }
}

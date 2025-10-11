import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().exec();
  }

  async countAll(): Promise<number> {
    return this.orderModel.countDocuments().exec();
  }

  // --- NEW, MORE EFFICIENT ANALYTICS METHOD ---
  async getAnalytics(): Promise<{
    total: number;
    pending: number;
    delivered: number;
  }> {
    // Run all counting queries in parallel for maximum efficiency
    const [totalCount, pendingCount, deliveredCount] = await Promise.all([
      this.orderModel.countDocuments().exec(),
      this.orderModel.countDocuments({ status: OrderStatus.PENDING }).exec(),
      this.orderModel.countDocuments({ status: OrderStatus.DELIVERED }).exec(),
    ]);

    return {
      total: totalCount,
      pending: pendingCount,
      delivered: deliveredCount,
    };
  }
}

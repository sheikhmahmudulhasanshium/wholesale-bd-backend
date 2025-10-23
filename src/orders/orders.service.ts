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

  async getAnalytics(): Promise<{
    total: number;
    pending: number;
    delivered: number;
  }> {
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

  // <-- SOLUTION: ADD THIS FINAL REQUIRED METHOD -->
  /**
   * Finds a single order by its unique ID.
   * This method is required by the UploadsService to validate that an order
   * exists before media can be associated with it.
   * @param id The string representation of the MongoDB ObjectId.
   * @returns A promise that resolves to the order document or null if not found.
   */
  async findById(id: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(id).exec();
  }
  // <-- END OF ADDED METHOD -->
}

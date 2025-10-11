import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { UserDocument } from '../users/schemas/user.schema';

function isUserDocument(doc: any): doc is UserDocument {
  return doc instanceof Model;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(
    dto: CreateOrderDto,
    customerId: string,
  ): Promise<OrderDocument> {
    const orderItems: OrderDocument['items'] = [];
    let subtotal = 0;
    let sellerId: Types.ObjectId | null = null;

    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product)
        throw new BadRequestException(
          `Product with ID ${item.productId} not found`,
        );
      if (!product.isActive || product.stockQuantity < item.quantity)
        throw new BadRequestException(
          `Product ${product.name} is unavailable or out of stock`,
        );
      if (item.quantity < product.minimumOrderQuantity)
        throw new BadRequestException(
          `Minimum order for ${product.name} is ${product.minimumOrderQuantity}`,
        );

      if (!sellerId) {
        sellerId = product.sellerId;
      } else if (!sellerId.equals(product.sellerId)) {
        throw new BadRequestException(
          'All items in an order must be from the same seller.',
        );
      }

      const pricePerUnit = this.calculatePriceForQuantity(
        product.pricingTiers,
        item.quantity,
      );
      const totalPrice = pricePerUnit * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice,
        productImage: product.images?.[0],
      });
    }

    if (!sellerId)
      throw new BadRequestException(
        'Could not determine seller for the order.',
      );

    const orderNumber = await this.generateOrderNumber();
    const newOrder = new this.orderModel({
      ...dto,
      orderNumber,
      items: orderItems,
      customerId: new Types.ObjectId(customerId),
      sellerId,
      subtotal,
      totalAmount: subtotal,
    });

    const savedOrder = await newOrder.save();

    for (const item of orderItems) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: -item.quantity, orderCount: 1 } },
      );
    }

    return this.findOne(savedOrder._id.toString());
  }

  async findAll(query: OrderQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const filter: Record<string, any> = {};

    if (query.customerId)
      filter.customerId = new Types.ObjectId(query.customerId);
    if (query.sellerId) filter.sellerId = new Types.ObjectId(query.sellerId);
    if (query.status) filter.status = query.status;
    if (query.startDate) filter.createdAt = { $gte: new Date(query.startDate) };
    if (query.endDate)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      filter.createdAt = { ...filter.createdAt, $lte: new Date(query.endDate) };

    // FIX: Await sequentially to guarantee correct type inference.
    const orders: OrderDocument[] = await this.orderModel
      .find(filter)
      .populate('customerId', 'firstName lastName')
      .populate('sellerId', 'businessName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.orderModel.countDocuments(filter);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid order ID');
    const order = await this.orderModel
      .findById(id)
      .populate('customerId')
      .populate('sellerId')
      .populate('items.productId', 'name images');
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(
    orderId: string,
    newStatus: string,
    userId: string,
    userRole: string,
  ): Promise<OrderDocument> {
    const order = await this.findOne(orderId);

    if (!isUserDocument(order.sellerId) || !isUserDocument(order.customerId)) {
      throw new NotFoundException(
        'Associated seller or customer data is missing for this order.',
      );
    }

    this.validateStatusTransition(
      order.status,
      newStatus,
      userRole,
      userId,
      order.sellerId._id.toString(),
      order.customerId._id.toString(),
    );

    order.status = newStatus;
    if (newStatus === 'cancelled' || newStatus === 'rejected') {
      await this.restoreProductStock(order);
    }

    const timestampField = `${newStatus}At`;
    const validTimestampFields = [
      'confirmedAt',
      'dispatchedAt',
      'deliveredAt',
      'cancelledAt',
    ];

    if (validTimestampFields.includes(timestampField)) {
      (order as Record<string, any>)[timestampField] = new Date();
    }

    return order.save();
  }

  private async restoreProductStock(order: OrderDocument) {
    for (const item of order.items) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: item.quantity, orderCount: -1 } },
      );
    }
  }

  private calculatePriceForQuantity(
    tiers: { minQuantity: number; pricePerUnit: number }[],
    quantity: number,
  ): number {
    const applicableTier = [...tiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((tier) => quantity >= tier.minQuantity);
    if (!applicableTier)
      throw new BadRequestException(
        `No pricing tier available for quantity ${quantity}`,
      );
    return applicableTier.pricePerUnit;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.orderModel.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`) },
    });
    return `WS-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private validateStatusTransition(
    current: string,
    next: string,
    role: string,
    userId: string,
    sellerId: string,
    customerId: string,
  ) {
    const transitions: Record<string, string[]> = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['ready_for_dispatch', 'cancelled'],
      ready_for_dispatch: ['dispatched'],
      dispatched: ['delivered'],
    };
    if (!transitions[current]?.includes(next))
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );

    const sellerActions = [
      'confirmed',
      'rejected',
      'processing',
      'ready_for_dispatch',
    ];
    const adminActions = ['dispatched', 'delivered'];
    const customerActions = ['cancelled'];

    if (
      sellerActions.includes(next) &&
      (role !== 'seller' || userId !== sellerId)
    )
      throw new ForbiddenException('Only the seller can perform this action.');
    if (adminActions.includes(next) && role !== 'admin')
      throw new ForbiddenException('Only an admin can perform this action.');
    if (
      customerActions.includes(next) &&
      (role !== 'customer' || userId !== customerId)
    )
      throw new ForbiddenException('Only the customer can cancel this order.');
  }
}

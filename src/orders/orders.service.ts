// src/orders/orders.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { ProductMediaPurpose } from 'src/products/enums/product-media-purpose.enum';
import { PaginationQueryDto } from 'src/uploads/dto/pagination-query.dto';
import {
  OrderSequence,
  OrderSequenceDocument,
} from './dto/order-sequence.schema';
import { Cart, CartDocument } from 'src/carts/schemas/cart.schema';
import { PaginatedOrderResponseDto } from './dto/paginated-order-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderSequence.name)
    private readonly sequenceModel: Model<OrderSequenceDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // --- V NEW: Method for Admins to get all orders with pagination ---
  async findAllAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedOrderResponseDto> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const mappedData = plainToInstance(
      OrderResponseDto,
      data.map((o) => o.toObject()),
    );

    return { data: mappedData, total, page, limit, totalPages };
  }
  // --- ^ END of NEW ---

  async findById(id: string): Promise<OrderDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.orderModel.findById(id).exec();
  }

  private async getNextOrderNumber(): Promise<string> {
    const sequenceDoc = await this.sequenceModel.findOneAndUpdate(
      { name: 'orderNumber' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true },
    );
    const year = new Date().getFullYear();
    const sequenceString = String(sequenceDoc.sequenceValue).padStart(4, '0');
    return `WBD-${year}-${sequenceString}`;
  }

  private getPriceForQuantity(
    product: ProductDocument,
    quantity: number,
  ): number {
    const sortedTiers = [...product.pricingTiers].sort(
      (a, b) => b.minQuantity - a.minQuantity,
    );
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        return tier.pricePerUnit;
      }
    }
    return product.pricingTiers[0]?.pricePerUnit || 0;
  }

  async createOrderFromCart(userId: Types.ObjectId): Promise<OrderResponseDto> {
    const cart = await this.cartModel.findOne({ userId }).populate<{
      items: Array<{ productId: ProductDocument | null; quantity: number }>;
    }>({
      path: 'items.productId',
      model: 'Product',
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const product = item.productId;

      if (!product) {
        throw new BadRequestException(
          'A product in your cart could not be found as it may have been removed. Please review your cart.',
        );
      }

      if (product.status !== 'active') {
        throw new BadRequestException(
          `Product "${
            product.name || product._id.toString()
          }" is no longer available.`,
        );
      }

      if (item.quantity < product.minimumOrderQuantity) {
        throw new BadRequestException(
          `Quantity for "${product.name}" is below the minimum of ${product.minimumOrderQuantity}.`,
        );
      }

      const pricePerUnitAtOrder = this.getPriceForQuantity(
        product,
        item.quantity,
      );
      const totalPrice = pricePerUnitAtOrder * item.quantity;
      totalAmount += totalPrice;

      const thumbnailMedia = product.media.find(
        (m) => m.purpose === ProductMediaPurpose.THUMBNAIL,
      );

      return {
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        thumbnailUrl: thumbnailMedia?.url,
        quantity: item.quantity,
        pricePerUnitAtOrder,
        totalPrice,
      };
    });

    const orderNumber = await this.getNextOrderNumber();

    const newOrder = new this.orderModel({
      orderNumber,
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        fullName: `${user.firstName} ${user.lastName}`,
        addressLine: user.address,
        city: 'Dhaka',
        zone: user.zone,
        phone: user.phone,
      },
    });

    const savedOrder = await newOrder.save();

    cart.items = [];
    await cart.save();

    return plainToInstance(OrderResponseDto, savedOrder.toObject());
  }

  async findAllForUser(userId: Types.ObjectId): Promise<OrderResponseDto[]> {
    const orders = await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 });
    return plainToInstance(
      OrderResponseDto,
      orders.map((o) => o.toObject()),
    );
  }

  async findOneForUser(
    orderId: string,
    userId: Types.ObjectId,
  ): Promise<OrderResponseDto> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (order.userId.toString() !== userId.toString()) {
      throw new ForbiddenException(
        'You do not have permission to view this order.',
      );
    }

    return plainToInstance(OrderResponseDto, order.toObject());
  }
}

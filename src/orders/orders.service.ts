// src/orders/orders.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from './schemas/order.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { ProductMediaPurpose } from 'src/products/enums/product-media-purpose.enum';
import { PaginatedOrderResponseDto } from './dto/paginated-order-response.dto';
import {
  OrderSequence,
  OrderSequenceDocument,
} from './schemas/order-sequence.schema';
import { Cart, CartDocument } from 'src/carts/schemas/cart.schema';
import { SeedOrdersDto } from './dto/seed-orders.dto';
import { PaginationQueryDto } from 'src/orders/dto/pagination-query.dto';

// Define explicit types for the populated cart to satisfy strict linting rules
interface PopulatedCartItem {
  productId: ProductDocument | null;
  quantity: number;
}

type CartForOrderCreation = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: PopulatedCartItem[];
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly MIGRATION_PASSWORD = 'run-wbd-migration-now';

  async runOneTimeWipe(password: string) {
    if (password !== this.MIGRATION_PASSWORD) {
      throw new ForbiddenException('Invalid migration password.');
    }
    this.logger.warn('--- RUNNING ONE-TIME ORDER DATA WIPE ---');
    try {
      const deleteResult = await this.orderModel.deleteMany({});
      this.logger.log(
        `Wiped ${deleteResult.deletedCount} documents from orders.`,
      );
      await this.sequenceModel.deleteMany({ name: 'orderNumber' });
      this.logger.log('Reset order number sequence.');
      const response = {
        status: 'success',
        message:
          "'orders' collection and sequence have been wiped successfully.",
        documentsDeleted: deleteResult.deletedCount,
      };
      this.logger.warn('--- ORDER WIPE COMPLETE ---');
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Order wipe failed:', errorMessage);
      throw new InternalServerErrorException(
        `Order wipe failed: ${errorMessage}`,
      );
    }
  }

  async runOneTimeSeed(password: string, payload: SeedOrdersDto) {
    if (password !== this.MIGRATION_PASSWORD) {
      throw new ForbiddenException('Invalid migration password.');
    }
    this.logger.warn('--- RUNNING ONE-TIME ORDER DATA SEED ---');
    if (!payload || !Array.isArray(payload.data)) {
      throw new BadRequestException(
        'Invalid payload. Expecting a JSON object with a "data" array.',
      );
    }
    try {
      const transformedData = payload.data.map((order) => {
        const mongoId = new Types.ObjectId(order._id);
        return {
          _id: mongoId,
          orderNumber: order.orderNumber,
          userId: new Types.ObjectId(order.customer._id),
          items: order.items.map((item) => ({
            productId: new Types.ObjectId(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnitAtOrder: item.pricePerUnitAtOrder,
            totalPrice: item.totalPrice,
          })),
          totalAmount: order.financials.grandTotal,
          shippingAddress: {
            fullName: order.deliveryDetails.shippingAddress.fullName,
            addressLine: order.deliveryDetails.shippingAddress.addressLine,
            city: order.deliveryDetails.shippingAddress.city,
            zone: order.deliveryDetails.shippingAddress.zone,
            phone: order.deliveryDetails.shippingAddress.phone,
          },
          status: order.status,
          paymentStatus:
            order.paymentDetails.status === 'partially_refunded'
              ? PaymentStatus.REFUNDED
              : (order.paymentDetails.status as PaymentStatus),
          adminNotes: order.notes.adminNote,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        };
      });
      const seedResult = await this.orderModel.insertMany(transformedData);
      this.logger.log(`Seeded ${seedResult.length} new documents into orders.`);
      const response = {
        status: 'success',
        message: "Seeding for 'orders' completed successfully.",
        documentsSeeded: seedResult.length,
      };
      this.logger.warn('--- ORDER SEEDING COMPLETE ---');
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Order seed failed:', errorMessage);
      throw new InternalServerErrorException(
        `Order seed failed: ${errorMessage}`,
      );
    }
  }

  async getOrderAnalytics(): Promise<{ total: number; pending: number }> {
    const [total, pending] = await Promise.all([
      this.orderModel.countDocuments().exec(),
      this.orderModel
        .countDocuments({ status: OrderStatus.PENDING_APPROVAL })
        .exec(),
    ]);
    return { total, pending };
  }

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderSequence.name)
    private readonly sequenceModel: Model<OrderSequenceDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

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

  async createOrderFromCart(
    id: string | Types.ObjectId,
  ): Promise<OrderResponseDto> {
    const isObjectId = Types.ObjectId.isValid(id as string);
    if (!isObjectId) {
      throw new BadRequestException('Invalid ID format provided.');
    }

    const cart = await this.cartModel
      .findOne({
        $or: [{ _id: id }, { userId: id }],
      })
      .populate<{
        items: Array<{ productId: ProductDocument | null; quantity: number }>;
      }>({
        path: 'items.productId',
        model: 'Product',
      });

    if (!cart) {
      throw new BadRequestException(
        `Cart with provided ID "${id.toString()}" not found.`,
      );
    }

    const populatedCart = cart.toObject() as CartForOrderCreation;

    if (populatedCart.items.length === 0) {
      throw new BadRequestException('The selected cart is empty.');
    }

    const user = await this.userModel.findById(populatedCart.userId);
    if (!user) {
      throw new NotFoundException(
        `User associated with cart "${populatedCart._id.toString()}" not found.`,
      );
    }

    let totalAmount = 0;
    const orderItems = populatedCart.items.map((item) => {
      const product = item.productId;
      if (!product) {
        throw new BadRequestException(
          'A product in the cart could not be found. Please review the cart.',
        );
      }
      if (product.status !== 'active') {
        throw new BadRequestException(
          `Product "${product.name}" is no longer available.`,
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
      userId: user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        fullName: `${user.firstName} ${user.lastName}`,
        addressLine: user.address,
        city: user.zone || 'N/A',
        zone: user.zone,
        phone: user.phone,
      },
    });

    const savedOrder = await newOrder.save();

    cart.items = [];
    await cart.save();

    return plainToInstance(OrderResponseDto, savedOrder.toObject());
  }

  async findAllForUser(
    userId: string | Types.ObjectId,
  ): Promise<OrderResponseDto[]> {
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
    userId: string | Types.ObjectId,
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

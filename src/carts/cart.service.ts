// src/cart/cart.service.ts

import {
  BadRequestException,
  ForbiddenException, // --- V NEW ---
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { plainToInstance } from 'class-transformer';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { PaginationQueryDto } from 'src/uploads/dto/pagination-query.dto';
import {
  AdminCartResponseDto,
  PaginatedAdminCartResponseDto,
} from './dto/admin-cart-response.dto';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema'; // --- V NEW ---

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findAllAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedAdminCartResponseDto> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.cartModel
        .find({ 'items.0': { $exists: true } }) // Only fetch non-empty carts
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email') // Populate user details
        .exec(),
      this.cartModel.countDocuments({ 'items.0': { $exists: true } }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const mappedData = plainToInstance(
      AdminCartResponseDto,
      data.map((c) => c.toObject()),
    );

    return { data: mappedData, total, page, limit, totalPages };
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

  private async buildCartResponse(
    cartDoc: CartDocument,
  ): Promise<CartResponseDto> {
    await cartDoc.populate({
      path: 'items.productId',
      model: 'Product',
    });

    if (!cartDoc.populated('items.productId')) {
      cartDoc.items = cartDoc.items.filter((item) => item.productId);
    }

    const cart = cartDoc.toObject();
    let grandTotal = 0;
    let totalQuantity = 0;

    const responseItems = cart.items
      .map((item) => {
        const product = item.productId as unknown as Product;
        if (!product) {
          return null;
        }

        const unitPrice = this.getPriceForQuantity(
          product as ProductDocument,
          item.quantity,
        );
        const itemTotal = unitPrice * item.quantity;
        grandTotal += itemTotal;
        totalQuantity += item.quantity;

        return {
          product: product,
          quantity: item.quantity,
          unitPrice,
          itemTotal,
        };
      })
      .filter(Boolean);

    const response = {
      ...cart,
      _id: cart._id.toString(),
      userId: cart.userId.toString(),
      items: responseItems,
      totalUniqueItems: responseItems.length,
      totalQuantity,
      grandTotal,
    };

    return plainToInstance(CartResponseDto, response, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getCart(userId: Types.ObjectId): Promise<CartResponseDto> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      return plainToInstance(CartResponseDto, {
        _id: '',
        userId: userId.toString(),
        items: [],
        totalUniqueItems: 0,
        totalQuantity: 0,
        grandTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return this.buildCartResponse(cart);
  }

  // --- V MODIFIED: Add user document parameter ---
  async addItem(
    user: UserDocument,
    addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    // --- V NEW: Block admins from adding items to a cart ---
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot perform purchasing actions.',
      );
    }
    // --- ^ END of NEW ---

    const userId = user._id;
    const { productId, quantity } = addToCartDto;

    const product = await this.productModel.findById(productId);
    if (!product || product.status !== 'active') {
      throw new NotFoundException(
        `Product with ID "${productId}" not found or is not active.`,
      );
    }

    if (quantity < product.minimumOrderQuantity) {
      throw new BadRequestException(
        `Quantity must be at least the minimum order quantity of ${product.minimumOrderQuantity}.`,
      );
    }

    let cart = await this.cartModel.findOne({ userId });

    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({ productId: product._id, quantity });
    }

    const updatedCart = await cart.save();
    return this.buildCartResponse(updatedCart);
  }

  async removeItem(
    userId: Types.ObjectId,
    productId: string,
  ): Promise<CartResponseDto> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format.');
    }

    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    if (cart.items.length === initialLength) {
      throw new NotFoundException(
        `Product with ID "${productId}" not found in cart.`,
      );
    }

    const updatedCart = await cart.save();
    return this.buildCartResponse(updatedCart);
  }

  async clearCart(userId: Types.ObjectId): Promise<CartResponseDto> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      return this.getCart(userId);
    }

    cart.items = [];
    const clearedCart = await cart.save();
    return this.buildCartResponse(clearedCart);
  }
}

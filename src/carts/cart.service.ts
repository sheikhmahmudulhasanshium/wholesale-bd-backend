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
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { plainToInstance } from 'class-transformer';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import {
  AdminCartResponseDto,
  PaginatedAdminCartResponseDto,
} from './dto/admin-cart-response.dto';
import { UserDocument } from 'src/users/schemas/user.schema';
import { SeedCartsDto } from './dto/seed-carts.dto';
import { UpdateCartItemDto } from './dto/admin-update-cart.dto';
import {
  PaginationQueryDto,
  SortByCartOption,
  SortOrderOption,
} from 'src/carts/dto/pagination-query.dto';

type PopulatedCartItem = Omit<CartItem, 'productId'> & {
  productId: ProductDocument | null;
};

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly MIGRATION_PASSWORD = 'run-wbd-migration-now';

  async runOneTimeWipe(password: string) {
    if (password !== this.MIGRATION_PASSWORD) {
      throw new ForbiddenException('Invalid migration password.');
    }
    this.logger.warn('--- RUNNING ONE-TIME CART DATA WIPE ---');
    try {
      const deleteResult = await this.cartModel.deleteMany({});
      this.logger.log(
        `Wiped ${deleteResult.deletedCount} documents from carts.`,
      );
      const response = {
        status: 'success',
        message: "'carts' collection has been wiped successfully.",
        documentsDeleted: deleteResult.deletedCount,
      };
      this.logger.warn('--- CART WIPE COMPLETE ---');
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Cart wipe failed:', errorMessage);
      throw new InternalServerErrorException(
        `Cart wipe failed: ${errorMessage}`,
      );
    }
  }

  async runOneTimeSeed(password: string, payload: SeedCartsDto[]) {
    if (password !== this.MIGRATION_PASSWORD) {
      throw new ForbiddenException('Invalid migration password.');
    }
    this.logger.warn('--- RUNNING ONE-TIME CART DATA SEED ---');
    if (!payload || !Array.isArray(payload)) {
      throw new BadRequestException(
        'Invalid payload. Expecting a JSON array of cart objects.',
      );
    }
    try {
      const transformedData = payload.map((cart) => {
        const cartItems = cart.itemsBySeller.flatMap((group) =>
          group.items.map((item) => ({
            productId: new Types.ObjectId(item.product._id),
            quantity: item.quantity,
          })),
        );
        const mongoId = new Types.ObjectId(cart._id);
        return {
          _id: mongoId,
          userId: new Types.ObjectId(cart.user._id),
          items: cartItems,
          createdAt: new Date(new Date(cart.updatedAt).getTime() - 10000),
          updatedAt: new Date(cart.updatedAt),
        };
      });
      const seedResult = await this.cartModel.insertMany(transformedData);
      this.logger.log(`Seeded ${seedResult.length} new documents into carts.`);
      const response = {
        status: 'success',
        message: "Seeding for 'carts' completed successfully.",
        documentsSeeded: seedResult.length,
      };
      this.logger.warn('--- CART SEEDING COMPLETE ---');
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Cart seed failed:', errorMessage);
      throw new InternalServerErrorException(
        `Cart seed failed: ${errorMessage}`,
      );
    }
  }

  async getActiveCartsCount(): Promise<{ totalActiveCarts: number }> {
    const count = await this.cartModel
      .countDocuments({ 'items.0': { $exists: true } })
      .exec();
    return { totalActiveCarts: count };
  }

  async findAllAdminRaw(): Promise<CartDocument[]> {
    return this.cartModel.find({ 'items.0': { $exists: true } }).exec();
  }

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private async getOrCreateCart(
    userId: string | Types.ObjectId,
  ): Promise<CartDocument> {
    return this.cartModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [] } },
      { upsert: true, new: true },
    );
  }

  private async buildCartResponse(
    cartDoc: CartDocument,
  ): Promise<CartResponseDto> {
    await cartDoc.populate<{ items: PopulatedCartItem[] }>({
      path: 'items.productId',
      model: 'Product',
      match: { status: 'active' },
    });

    let needsSaving = false;
    const initialItemCount = cartDoc.items.length;

    const populatedItems = cartDoc.items as unknown as PopulatedCartItem[];
    const validPopulatedItems = populatedItems.filter((item) => item.productId);

    if (validPopulatedItems.length < initialItemCount) {
      needsSaving = true;
      cartDoc.items = validPopulatedItems.map((item) => ({
        productId: item.productId!._id,
        quantity: item.quantity,
      }));
    }

    const cart = cartDoc.toObject();
    let grandTotal = 0;
    let totalQuantity = 0;

    const responseItems = validPopulatedItems.map((item) => {
      const product = item.productId!;
      const unitPrice = this.getPriceForQuantity(product, item.quantity);
      const itemTotal = unitPrice * item.quantity;
      grandTotal += itemTotal;
      totalQuantity += item.quantity;
      return { product, quantity: item.quantity, unitPrice, itemTotal };
    });

    if (needsSaving) {
      await cartDoc.save();
    }
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

  async getCart(userId: string | Types.ObjectId): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    if (!cart) {
      throw new NotFoundException(
        `Cart for user with ID "${userId.toString()}" not found.`,
      );
    }
    return this.buildCartResponse(cart);
  }

  async findCartById(cartId: string): Promise<CartResponseDto> {
    if (!Types.ObjectId.isValid(cartId)) {
      throw new BadRequestException('Invalid Cart ID format.');
    }
    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    }
    return this.buildCartResponse(cart);
  }

  async addItem(
    user: UserDocument,
    addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
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
    const cart = await this.getOrCreateCart(user._id);
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

  async adminUpdateCart(
    userId: string,
    itemsToUpdate: UpdateCartItemDto[],
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    for (const item of itemsToUpdate) {
      const { productId, quantity } = item;
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${productId}" not found.`,
        );
      }
      if (quantity > 0) {
        if (quantity < product.minimumOrderQuantity) {
          throw new BadRequestException(
            `Quantity for "${product.name}" must be at least ${product.minimumOrderQuantity}.`,
          );
        }
        const itemIndex = cart.items.findIndex(
          (i) => i.productId.toString() === productId,
        );
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity = quantity;
        } else {
          cart.items.push({
            productId: new Types.ObjectId(productId),
            quantity,
          });
        }
      } else {
        cart.items = cart.items.filter(
          (i) => i.productId.toString() !== productId,
        );
      }
    }
    await cart.save();
    return this.buildCartResponse(cart);
  }

  async removeItem(
    userId: string | Types.ObjectId,
    productId: string,
  ): Promise<CartResponseDto> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format.');
    }
    const cart = await this.getOrCreateCart(userId);
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

  async clearCart(userId: string | Types.ObjectId): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    const clearedCart = await cart.save();
    return this.buildCartResponse(clearedCart);
  }

  // --- vvvvvv FINAL, CORRECTED SORTING LOGIC vvvvvv ---
  async findAllAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedAdminCartResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = SortByCartOption.UPDATED_AT,
      sortOrder = SortOrderOption.DESC,
    } = paginationQuery;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === SortOrderOption.ASC ? 1 : -1;

    const allCarts = await this.cartModel
      .find({ 'items.0': { $exists: true } })
      .populate<{ items: PopulatedCartItem[] }>({
        path: 'items.productId',
        model: 'Product',
      })
      .populate<{ userId: UserDocument }>('userId', 'firstName lastName email')
      .exec();

    const cartsWithTotalValue = allCarts.map((cart) => {
      let totalValue = 0;
      const validItems = (cart.items as unknown as PopulatedCartItem[]).filter(
        (item): item is typeof item & { productId: ProductDocument } =>
          !!item.productId,
      );

      for (const item of validItems) {
        const price = this.getPriceForQuantity(item.productId, item.quantity);
        totalValue += price * item.quantity;
      }
      // Return a plain object with all necessary data
      return {
        _id: cart._id,
        userId: cart.userId,
        items: cart.items,
        updatedAt: cart.updatedAt,
        totalValue,
      };
    });

    cartsWithTotalValue.sort((a, b) => {
      if (sortBy === SortByCartOption.TOTAL_VALUE) {
        return (a.totalValue - b.totalValue) * sortDirection;
      }
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) *
        sortDirection
      );
    });

    const paginatedData = cartsWithTotalValue.slice(skip, skip + limit);
    const total = allCarts.length;
    const totalPages = Math.ceil(total / limit);

    // Manually construct the final data array. This is the guaranteed fix.
    const mappedData: AdminCartResponseDto[] = paginatedData.map((cartData) => {
      const user = cartData.userId;
      return {
        _id: cartData._id.toString(),
        userId: user
          ? {
              _id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            }
          : null!,
        items: cartData.items.map((item) => ({
          productId: item.productId?._id.toString() ?? 'unknown',
          quantity: item.quantity,
        })),
        updatedAt: cartData.updatedAt,
        totalValue: cartData.totalValue,
      };
    });

    return { data: mappedData, total, page, limit, totalPages };
  }
  // --- ^^^^^^ END OF FINAL LOGIC ^^^^^^ ---

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
}

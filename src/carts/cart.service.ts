// src/carts/cart.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartStatus } from './schemas/cart.schema';
import { ProductsService } from '../products/products.service';
import { UserService } from '../users/users.service';
import { ProductDocument } from 'src/products/schemas/product.schema';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { User, UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import {
  CartSearchQueryDto,
  CartSearchSortByOption,
  SortOrderOption,
} from './dto/cart-search-query.dto';
import { PaginatedRichCartResponseDto } from './dto/paginated-rich-cart-response.dto';

// Define the SearchableCartItem type for the user-specific search response
export interface SearchableCartItem {
  seller: { _id: string; businessName: string };
  product: { _id: string; name: string };
  quantity: number;
  pricing: { unitPrice: number; itemTotal: number };
  warnings: string[];
}

export interface RichCart {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingDetails: { address: string | null; contactPhone: string | null };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string | null;
  };
  itemsBySeller: {
    seller: {
      _id: string;
      businessName: string;
      phone: string | null;
      address: string | null;
    };
    items: {
      product: { _id: string; name: string };
      quantity: number;
      pricing: { unitPrice: number; itemTotal: number };
      warnings: string[];
    }[];
  }[];
  summary: {
    totalUniqueItems: number;
    totalQuantity: number;
    grandTotal: number;
  };
}

type PricingTier = {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
};
type ProductWithDetails = ProductDocument & {
  pricingTiers?: PricingTier[];
  stockQuantity?: number;
  minimumOrderQuantity?: number;
};
type UserWithDetails = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone?: string;
  address?: string;
  businessName?: string;
};
interface CartItemDetails {
  productId: Types.ObjectId;
  quantity: number;
}
type CartWithDetails = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDetails[];
  createdAt: Date;
  updatedAt: Date;
  status?: CartStatus;
  shippingAddress?: string;
  contactPhone?: string;
};

function getUnitPriceForQuantity(
  tiers: PricingTier[],
  quantity: number,
): number {
  if (!tiers || tiers.length === 0) return 0;
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) return tier.pricePerUnit;
  }
  return 0;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly productsService: ProductsService,
    private readonly userService: UserService,
  ) {}

  // --- THIS IS THE NEW UNIFIED SEARCH METHOD ---
  async searchCarts(
    user: UserDocument,
    query: CartSearchQueryDto,
  ): Promise<PaginatedRichCartResponseDto | SearchableCartItem[]> {
    if (user.role === UserRole.ADMIN) {
      // --- ADMIN LOGIC ---
      const {
        page = 1,
        limit = 10,
        sortBy = CartSearchSortByOption.UPDATED_AT,
        sortOrder = SortOrderOption.DESC,
        q,
      } = query;

      // Fetch all carts and enrich them. For admin, we filter after enrichment.
      let allRichCarts = await this.getAllCartsRich();

      // Filter by search term 'q' if provided (searches user's name/email)
      if (q) {
        const searchTerm = q.toLowerCase().trim();
        allRichCarts = allRichCarts.filter(
          (cart) =>
            cart.user.firstName.toLowerCase().includes(searchTerm) ||
            cart.user.lastName.toLowerCase().includes(searchTerm) ||
            cart.user.email.toLowerCase().includes(searchTerm),
        );
      }

      // Sort in memory
      allRichCarts.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case CartSearchSortByOption.TOTAL_VALUE:
            comparison = a.summary.grandTotal - b.summary.grandTotal;
            break;
          case CartSearchSortByOption.STATUS:
            comparison = a.status.localeCompare(b.status);
            break;
          case CartSearchSortByOption.CREATED_AT:
            comparison =
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          default: // UPDATED_AT
            comparison =
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
        }
        return sortOrder === SortOrderOption.ASC ? comparison : -comparison;
      });

      // Paginate the final result
      const skip = (page - 1) * limit;
      const paginatedData = allRichCarts.slice(skip, skip + limit);
      const total = allRichCarts.length;

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } else {
      // --- USER (CUSTOMER/SELLER) LOGIC ---
      const {
        q,
        sortBy = CartSearchSortByOption.PRODUCT_NAME,
        sortOrder = SortOrderOption.ASC,
      } = query;
      const sortMultiplier = sortOrder === SortOrderOption.ASC ? 1 : -1;

      const richCart = await this.getCartForUser(user);

      let allItems: SearchableCartItem[] = [];
      for (const sellerGroup of richCart.itemsBySeller) {
        const itemsWithSeller = sellerGroup.items.map((item) => ({
          ...item,
          seller: {
            _id: sellerGroup.seller._id,
            businessName: sellerGroup.seller.businessName,
          },
        }));
        allItems.push(...itemsWithSeller);
      }

      if (q) {
        const searchTerm = q.toLowerCase().trim();
        allItems = allItems.filter(
          (item) =>
            item.product.name.toLowerCase().includes(searchTerm) ||
            item.seller.businessName.toLowerCase().includes(searchTerm),
        );
      }

      allItems.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case CartSearchSortByOption.PRICE:
            comparison = a.pricing.itemTotal - b.pricing.itemTotal;
            break;
          case CartSearchSortByOption.SELLER_NAME:
            comparison = a.seller.businessName.localeCompare(
              b.seller.businessName,
            );
            break;
          case CartSearchSortByOption.WARNINGS:
            comparison = b.warnings.length - a.warnings.length;
            break;
          default: // PRODUCT_NAME
            comparison = a.product.name.localeCompare(b.product.name);
            break;
        }
        return comparison * sortMultiplier;
      });

      return allItems;
    }
  }

  // --- ALL OTHER METHODS BELOW ARE UNCHANGED ---

  async getCartForUser(user: UserDocument): Promise<RichCart> {
    const cart = await this.findOrCreateCartByUserId(user._id);
    const transformedCart = await this.transformCart(cart);
    if (!transformedCart) {
      throw new NotFoundException('Could not retrieve cart details.');
    }
    return transformedCart;
  }

  async getCartById(user: UserDocument, cartId: string): Promise<RichCart> {
    if (!Types.ObjectId.isValid(cartId))
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    const cart = await this.cartModel.findById(cartId);
    if (!cart)
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    if (
      user.role !== UserRole.ADMIN &&
      cart.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this cart.',
      );
    }
    const transformedCart = await this.transformCart(cart);
    if (!transformedCart)
      throw new NotFoundException(
        `Could not retrieve details for cart ID "${cartId}".`,
      );
    return transformedCart;
  }

  async getAllCartsRich(): Promise<RichCart[]> {
    const rawCarts = await this.cartModel.find({}).exec();
    const richCarts = await Promise.all(
      rawCarts.map((cart) => this.transformCart(cart)),
    );
    return richCarts.filter((cart): cart is RichCart => cart !== null);
  }

  async addItemsToCart(
    user: UserDocument,
    addToCartDto: AddToCartDto,
  ): Promise<RichCart> {
    const { items } = addToCartDto;
    const cart = await this.findOrCreateCartByUserId(user._id);
    if ((cart.status as CartStatus) === CartStatus.LOCKED) {
      throw new ForbiddenException('Cannot add items to a locked cart.');
    }
    for (const itemDto of items) {
      const product = await this.productsService.findById(
        itemDto.productId.toString(),
      );
      if (!product) {
        throw new BadRequestException(
          `Product with ID "${itemDto.productId.toString()}" does not exist.`,
        );
      }
      const existingItemIndex = cart.items.findIndex(
        (i) => i.productId.toString() === itemDto.productId.toString(),
      );
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += itemDto.quantity;
      } else {
        cart.items.push({
          productId: itemDto.productId,
          quantity: itemDto.quantity,
        });
      }
    }
    const updatedCart = await cart.save();
    const transformedCart = await this.transformCart(updatedCart);
    if (!transformedCart) {
      const cartId = (cart as { _id: Types.ObjectId })._id.toString();
      throw new NotFoundException(
        `Could not retrieve details for updated cart ID "${cartId}".`,
      );
    }
    return transformedCart;
  }

  async updateCart(
    user: UserDocument,
    updateDto: UpdateCartDto,
  ): Promise<RichCart> {
    const { items } = updateDto;
    const cart = await this.findOrCreateCartByUserId(user._id);
    if ((cart.status as CartStatus) === CartStatus.LOCKED) {
      throw new ForbiddenException(
        'Cannot modify a locked cart. Please complete or cancel the checkout process.',
      );
    }
    for (const itemDto of items) {
      const product = await this.productsService.findById(
        itemDto.productId.toString(),
      );
      if (!product) {
        throw new BadRequestException(
          `Product with ID "${itemDto.productId.toString()}" does not exist.`,
        );
      }
      const existingItemIndex = cart.items.findIndex(
        (i) => i.productId.toString() === itemDto.productId.toString(),
      );
      if (itemDto.quantity > 0) {
        if (existingItemIndex > -1) {
          cart.items[existingItemIndex].quantity = itemDto.quantity;
        } else {
          cart.items.push({
            productId: itemDto.productId,
            quantity: itemDto.quantity,
          });
        }
      } else {
        if (existingItemIndex > -1) {
          cart.items.splice(existingItemIndex, 1);
        }
      }
    }
    const updatedCart = await cart.save();
    const transformedCart = await this.transformCart(updatedCart);
    if (!transformedCart) {
      const cartId = (cart as { _id: Types.ObjectId })._id.toString();
      throw new NotFoundException(
        `Could not retrieve details for updated cart ID "${cartId}".`,
      );
    }
    return transformedCart;
  }

  async updateShippingInfo(
    user: UserDocument,
    dto: UpdateShippingDto,
  ): Promise<RichCart> {
    const cart = await this.findOrCreateCartByUserId(user._id);
    if ((cart.status as CartStatus) === CartStatus.LOCKED) {
      throw new ForbiddenException(
        'Cannot modify shipping info for a locked cart.',
      );
    }
    if (dto.shippingAddress) cart.shippingAddress = dto.shippingAddress;
    if (dto.contactPhone) cart.contactPhone = dto.contactPhone;

    const updatedCart = await cart.save();
    const transformedCart = await this.transformCart(updatedCart);
    if (!transformedCart) {
      const cartId = (cart as { _id: Types.ObjectId })._id.toString();
      throw new NotFoundException(
        `Could not retrieve details for updated cart ID "${cartId}".`,
      );
    }
    return transformedCart;
  }

  async updateCartStatus(
    user: UserDocument,
    cartId: string,
    updateDto: UpdateCartStatusDto,
  ): Promise<RichCart> {
    if (!Types.ObjectId.isValid(cartId))
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    const cart = await this.cartModel.findById(cartId);
    if (!cart)
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    if (
      user.role !== UserRole.ADMIN &&
      cart.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this cart.',
      );
    }
    cart.status = updateDto.status;
    const updatedCart = await cart.save();
    const transformedCart = await this.transformCart(updatedCart);
    if (!transformedCart) {
      throw new NotFoundException(
        `Could not retrieve details for updated cart ID "${cartId}".`,
      );
    }
    return transformedCart;
  }

  async deleteCart(
    user: UserDocument,
    cartId: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(cartId))
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    const cart = await this.cartModel.findById(cartId);
    if (!cart)
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    if (
      user.role !== UserRole.ADMIN &&
      cart.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this cart.',
      );
    }
    await this.cartModel.deleteOne({ _id: cartId });
    return {
      message: `Cart with ID "${cartId}" has been successfully deleted.`,
    };
  }

  async countActiveCarts(): Promise<{ totalActiveCarts: number }> {
    const count = await this.cartModel.countDocuments({
      status: CartStatus.ACTIVE,
    });
    return { totalActiveCarts: count };
  }

  async countAllCarts(): Promise<{ totalCarts: number }> {
    const count = await this.cartModel.countDocuments({});
    return { totalCarts: count };
  }

  async runCleanupTasks(confirmation: string): Promise<object> {
    if (confirmation !== 'confirm-cart-cleanup') {
      throw new ForbiddenException('Invalid confirmation phrase.');
    }
    this.logger.warn('--- RUNNING CART DATA CLEANUP TASKS ---');
    const updateResult = await this.cartModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: CartStatus.ACTIVE } },
    );
    this.logger.log(
      `Task 1: Updated ${updateResult.modifiedCount} carts to add 'status: active'.`,
    );
    interface DuplicateGroup {
      _id: Types.ObjectId;
      count: number;
      docs: Types.ObjectId[];
    }
    const duplicates = await this.cartModel.aggregate<DuplicateGroup>([
      {
        $group: { _id: '$userId', count: { $sum: 1 }, docs: { $push: '$_id' } },
      },
      { $match: { count: { $gt: 1 } } },
    ]);
    let duplicatesRemoved = 0;
    if (duplicates.length > 0) {
      this.logger.log(
        `Found ${duplicates.length} user(s) with duplicate carts.`,
      );
      const idsToDelete: Types.ObjectId[] = [];
      interface CartId {
        _id: Types.ObjectId;
      }
      for (const group of duplicates) {
        const carts = (await this.cartModel
          .find({ userId: group._id })
          .sort({ createdAt: 1 })
          .select('_id')
          .lean()) as unknown as CartId[];
        const cartsToKeep = carts.slice(0, 1).map((c) => c._id.toString());
        const cartsToDelete = carts.filter(
          (c) => !cartsToKeep.includes(c._id.toString()),
        );
        idsToDelete.push(...cartsToDelete.map((c) => c._id));
      }
      if (idsToDelete.length > 0) {
        const deleteResult = await this.cartModel.deleteMany({
          _id: { $in: idsToDelete },
        });
        duplicatesRemoved = deleteResult.deletedCount;
      }
    }
    this.logger.log(`Task 2: Removed ${duplicatesRemoved} duplicate carts.`);
    interface LeanCartRef {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
    }
    const users = await this.userModel.find({}, '_id').lean().exec();
    const validUserIds = new Set(users.map((u) => u._id.toString()));
    const allCarts = (await this.cartModel
      .find({}, '_id userId')
      .lean()
      .exec()) as unknown as LeanCartRef[];
    const orphanCartIds = allCarts
      .filter((cart) => !validUserIds.has(cart.userId.toString()))
      .map((cart) => cart._id);
    let orphansRemoved = 0;
    if (orphanCartIds.length > 0) {
      const deleteResult = await this.cartModel.deleteMany({
        _id: { $in: orphanCartIds },
      });
      orphansRemoved = deleteResult.deletedCount;
    }
    this.logger.log(`Task 3: Removed ${orphansRemoved} orphaned carts.`);
    this.logger.warn('--- CART CLEANUP COMPLETE ---');
    return {
      message: 'Cart cleanup tasks completed successfully.',
      cartsUpdatedWithStatus: updateResult.modifiedCount,
      duplicatesRemoved,
      orphansRemoved,
    };
  }

  private async findOrCreateCartByUserId(
    userId: Types.ObjectId,
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.log(`Creating new cart for user ID: ${userId.toString()}`);
      cart = await this.cartModel.create({ userId, status: CartStatus.ACTIVE });
    }
    return cart;
  }

  private async transformCart(cart: CartDocument): Promise<RichCart | null> {
    const detailedCart = cart.toObject() as CartWithDetails;
    const userIdStr = detailedCart.userId.toString();
    const [user, products] = await Promise.all([
      Types.ObjectId.isValid(userIdStr)
        ? this.userService.findById(userIdStr)
        : Promise.resolve(null),
      Promise.all(
        detailedCart.items.map((item) =>
          this.productsService.findById(item.productId.toString()),
        ),
      ),
    ]);
    if (!user) {
      this.logger.warn(
        `User with ID ${userIdStr} not found for cart ${detailedCart._id.toString()}. Skipping.`,
      );
      return null;
    }
    const detailedUser = user as UserWithDetails;
    const validProducts = products.filter(
      (p): p is ProductDocument => p !== null,
    );
    const itemsBySellerMap = new Map<string, { seller: any; items: any[] }>();
    let grandTotal = 0;
    let totalQuantity = 0;
    const sellerIds = [
      ...new Set(validProducts.map((p) => p.sellerId.toString())),
    ];
    const sellers = await Promise.all(
      sellerIds.map((id) =>
        Types.ObjectId.isValid(id)
          ? this.userService.findById(id)
          : Promise.resolve(null),
      ),
    );
    const sellersMap = new Map(
      sellers.filter((s) => s !== null).map((s) => [s._id.toString(), s]),
    );
    for (const cartItem of detailedCart.items) {
      const product = validProducts.find(
        (p) => p._id.toString() === cartItem.productId.toString(),
      );
      if (!product) continue;
      const detailedProduct = product as ProductWithDetails;
      const sellerId = detailedProduct.sellerId.toString();
      const sellerDoc = sellersMap.get(sellerId) as UserWithDetails;
      if (!sellerDoc) continue;
      if (!itemsBySellerMap.has(sellerId)) {
        itemsBySellerMap.set(sellerId, {
          seller: {
            _id: sellerDoc._id,
            businessName:
              sellerDoc.businessName ||
              `${sellerDoc.firstName} ${sellerDoc.lastName}`,
            phone: sellerDoc.phone || null,
            address: sellerDoc.address || null,
          },
          items: [],
        });
      }
      const unitPrice = getUnitPriceForQuantity(
        detailedProduct.pricingTiers,
        cartItem.quantity,
      );
      const itemTotal = unitPrice * cartItem.quantity;
      const warnings: string[] = [];
      if (
        detailedProduct.stockQuantity !== undefined &&
        detailedProduct.stockQuantity < cartItem.quantity
      ) {
        warnings.push(
          'This product is currently out of stock. Please remove it to proceed with checkout for this seller.',
        );
      }
      if (
        detailedProduct.minimumOrderQuantity &&
        cartItem.quantity < detailedProduct.minimumOrderQuantity
      ) {
        warnings.push(
          `The minimum order for this item is ${detailedProduct.minimumOrderQuantity}.`,
        );
      }
      const enrichedItem = {
        product: { _id: detailedProduct._id, name: detailedProduct.name },
        quantity: cartItem.quantity,
        pricing: { unitPrice, itemTotal },
        warnings,
      };
      itemsBySellerMap.get(sellerId)?.items.push(enrichedItem);
      grandTotal += itemTotal;
      totalQuantity += cartItem.quantity;
    }
    return {
      _id: detailedCart._id.toString(),
      status: detailedCart.status || 'active',
      createdAt: detailedCart.createdAt.toISOString(),
      updatedAt: detailedCart.updatedAt.toISOString(),
      shippingDetails: {
        address: detailedCart.shippingAddress || detailedUser.address || null,
        contactPhone: detailedCart.contactPhone || detailedUser.phone || null,
      },
      user: {
        _id: detailedUser._id.toString(),
        firstName: detailedUser.firstName,
        lastName: detailedUser.lastName,
        role: detailedUser.role,
        email: detailedUser.email,
        phone: detailedUser.phone || null,
      },
      itemsBySeller: Array.from(itemsBySellerMap.values()),
      summary: {
        totalUniqueItems: detailedCart.items.length,
        totalQuantity: totalQuantity,
        grandTotal: grandTotal,
      },
    };
  }
}

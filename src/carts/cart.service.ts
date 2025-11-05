// src/carts/cart.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { ProductsService } from '../products/products.service';
import { ProductDocument } from 'src/products/schemas/product.schema';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import { UserService } from 'src/users/users.service';

export interface RichCart {
  _id: string;
  status: string;
  updatedAt: string;
  shippingDetails: {
    address: string | null;
    contactPhone: string | null;
  };
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
      product: {
        _id: string;
        name: string;
      };
      quantity: number;
      pricing: {
        unitPrice: number;
        itemTotal: number;
      };
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
  updatedAt: Date;
  status?: string;
  shippingAddress?: string;
  contactPhone?: string;
};

function getUnitPriceForQuantity(
  tiers: PricingTier[],
  quantity: number,
): number {
  if (!tiers || tiers.length === 0) {
    return 0;
  }
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return tier.pricePerUnit;
    }
  }
  return 0;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    private readonly productsService: ProductsService,
    private readonly userService: UserService,
  ) {}

  async getAllCarts(): Promise<CartDocument[]> {
    return this.cartModel.find({}).exec();
  }

  async getAllCartsRich(): Promise<RichCart[]> {
    const rawCarts = await this.cartModel.find({}).exec();
    const richCarts = await Promise.all(
      rawCarts.map((cart) => this.transformCart(cart)),
    );
    return richCarts.filter((cart): cart is RichCart => cart !== null);
  }

  async updateCartStatus(
    cartId: string,
    updateCartStatusDto: UpdateCartStatusDto,
  ): Promise<RichCart> {
    if (!Types.ObjectId.isValid(cartId)) {
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    }

    const cart = await this.cartModel.findById(cartId);

    if (!cart) {
      throw new NotFoundException(`Cart with ID "${cartId}" not found.`);
    }

    cart.status = updateCartStatusDto.status;

    const updatedCart = await cart.save();

    const transformedCart = await this.transformCart(updatedCart);
    if (!transformedCart) {
      // This case is highly unlikely but handles potential race conditions or data issues
      throw new NotFoundException(
        `Could not retrieve details for updated cart ID "${cartId}".`,
      );
    }
    return transformedCart;
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
        `User with ID ${userIdStr} not found or invalid for cart ${detailedCart._id.toString()}. Skipping.`,
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

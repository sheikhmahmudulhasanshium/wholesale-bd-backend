// src/user-activity/user-activity.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import {
  UserActivity,
  UserActivityDocument,
} from './schemas/user-activity.schema';
import { ActivityType, TrackActivityDto } from './dto/track-activity.dto';
import { DiscoveryResponseDto } from './dto/discovery-response.dto';
import { UserDocument } from 'src/users/schemas/user.schema';
import {
  Product,
  ProductDocument,
  ProductMedia,
} from 'src/products/schemas/product.schema';
import { PublicProductResponseDto } from 'src/products/dto/public-product-response.dto';
import { ProductMediaDto } from 'src/products/dto/product-media.dto';
import { ProductMediaPurpose } from 'src/products/enums/product-media-purpose.enum';
import {
  Category,
  CategoryDocument,
} from 'src/categories/schemas/category.schema';

const MAX_RECENT_ITEMS = 10;
const MAX_RECOMMENDATION_ITEMS = 5;

// --- V NEW: Define a type for the aggregation result ---
interface CategoryCountResult {
  _id: Types.ObjectId;
  count: number;
}

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  constructor(
    @InjectModel(UserActivity.name)
    private readonly activityModel: Model<UserActivityDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async getDiscoveryFeed(user: UserDocument): Promise<DiscoveryResponseDto> {
    const activity = await this.activityModel.findOne({ userId: user._id });

    if (
      !activity ||
      !activity.viewedProducts ||
      activity.viewedProducts.length === 0
    ) {
      return {
        trendingNow: await this._getTrendingProducts(),
      };
    }

    const [recentlyViewed, recommendedForYou] = await Promise.all([
      this._getRecentlyViewedProducts(activity),
      this._getRecommendedProducts(activity),
    ]);

    return {
      recentlyViewed,
      recommendedForYou,
    };
  }

  async trackActivity(dto: TrackActivityDto): Promise<void> {
    try {
      switch (dto.type) {
        case ActivityType.VIEW_PRODUCT:
          if (dto.productId) {
            await this.addRecentProductView(
              new Types.ObjectId(dto.userId.toString()),
              new Types.ObjectId(dto.productId),
            );
          }
          break;
        case ActivityType.SEARCH:
          if (dto.searchQuery) {
            await this.addRecentSearch(
              new Types.ObjectId(dto.userId.toString()),
              dto.searchQuery,
            );
          }
          break;
        default:
          this.logger.warn(`Unknown activity type: ${dto.type as string}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to track activity for user ${dto.userId.toString()}`,
        error,
      );
    }
  }

  private async addRecentProductView(
    userId: Types.ObjectId,
    productId: Types.ObjectId,
  ): Promise<void> {
    await this.activityModel.updateOne(
      { userId },
      { $pull: { viewedProducts: productId } },
      { upsert: true },
    );
    await this.activityModel.updateOne(
      { userId },
      {
        $push: {
          viewedProducts: {
            $each: [productId],
            $position: 0,
            $slice: MAX_RECENT_ITEMS,
          },
        },
      },
      { upsert: true },
    );
  }

  private async addRecentSearch(
    userId: Types.ObjectId,
    searchQuery: string,
  ): Promise<void> {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) return;
    await this.activityModel.updateOne(
      { userId },
      { $pull: { recentSearches: cleanedQuery } },
      { upsert: true },
    );
    await this.activityModel.updateOne(
      { userId },
      {
        $push: {
          recentSearches: {
            $each: [cleanedQuery],
            $position: 0,
            $slice: MAX_RECENT_ITEMS,
          },
        },
      },
      { upsert: true },
    );
  }

  private async _getRecentlyViewedProducts(
    activity: UserActivityDocument,
  ): Promise<PublicProductResponseDto[]> {
    if (!activity.viewedProducts || activity.viewedProducts.length === 0) {
      return [];
    }
    const products = await this.productModel.find({
      _id: { $in: activity.viewedProducts },
    });
    const sortedProducts = products.sort((a, b) => {
      const indexA = activity.viewedProducts.findIndex((id) =>
        id.equals(a._id),
      );
      const indexB = activity.viewedProducts.findIndex((id) =>
        id.equals(b._id),
      );
      return indexA - indexB;
    });
    return sortedProducts.map((p) => this._mapProductToPublicResponse(p));
  }

  private async _getRecommendedProducts(activity: UserActivityDocument) {
    // --- V FIX: Apply the type to the aggregate call ---
    const categoryCounts =
      await this.productModel.aggregate<CategoryCountResult>([
        { $match: { _id: { $in: activity.viewedProducts } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);

    if (categoryCounts.length === 0) return undefined;

    // Now `categoryCounts[0]` is correctly typed, and accessing ._id is safe
    const favoriteCategoryId = categoryCounts[0]._id;
    const favoriteCategory =
      await this.categoryModel.findById(favoriteCategoryId);

    if (!favoriteCategory) return undefined;

    const recommendedProducts = await this.productModel
      .find({
        categoryId: favoriteCategoryId,
        _id: { $nin: activity.viewedProducts },
      })
      .sort({ viewCount: -1, orderCount: -1 })
      .limit(MAX_RECOMMENDATION_ITEMS);

    if (recommendedProducts.length === 0) return undefined;

    return {
      title: `Popular in ${favoriteCategory.name}`,
      items: recommendedProducts.map((p) =>
        this._mapProductToPublicResponse(p),
      ),
    };
  }

  private async _getTrendingProducts() {
    const trendingProducts = await this.productModel
      .find({ status: 'active' })
      .sort({ orderCount: -1, viewCount: -1 })
      .limit(MAX_RECOMMENDATION_ITEMS);

    return {
      title: 'Trending Now',
      items: trendingProducts.map((p) => this._mapProductToPublicResponse(p)),
    };
  }

  private _mapProductToPublicResponse(
    product: ProductDocument,
  ): PublicProductResponseDto {
    const productObj = product.toObject<Product & { _id: Types.ObjectId }>({
      versionKey: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media, images: _images, orderCount, ...restOfProduct } = productObj;

    const sortedMedia: ProductMedia[] = (media || []).sort(
      (a, b) => a.priority - b.priority,
    );
    const thumbnail =
      sortedMedia.find((m) => m.purpose === ProductMediaPurpose.THUMBNAIL) ||
      null;
    const previews = sortedMedia.filter(
      (m) => m.purpose === ProductMediaPurpose.PREVIEW,
    );

    const sourceObject = {
      ...restOfProduct,
      _id: productObj._id.toString(),
      categoryId: productObj.categoryId.toString(),
      zoneId: productObj.zoneId.toString(),
      sellerId: productObj.sellerId.toString(),
      thumbnail: thumbnail ? ProductMediaDto.fromSchema(thumbnail) : null,
      previews: previews.map((mediaItem) =>
        ProductMediaDto.fromSchema(mediaItem),
      ),
    };
    return plainToInstance(PublicProductResponseDto, sourceObject);
  }
}

// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import {
  Product,
  ProductDocument,
  ProductMedia,
} from '../products/schemas/product.schema';
import { ProductMediaPurpose } from '../products/enums/product-media-purpose.enum';
import { PublicProductResponseDto } from '../products/dto/public-product-response.dto';
import { ProductMediaDto } from '../products/dto/product-media.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import {
  SearchDictionary,
  SearchDictionaryDocument,
} from './schemas/search-dictionary.schema';
import { UserActivityService } from 'src/user-activity/user-activity.service';
import { UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { ActivityType } from 'src/user-activity/dto/track-activity.dto';
import {
  UserActivity,
  UserActivityDocument,
} from 'src/user-activity/schemas/user-activity.schema';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(SearchDictionary.name)
    private readonly dictionaryModel: Model<SearchDictionaryDocument>,
    @InjectModel(UserActivity.name)
    private readonly activityModel: Model<UserActivityDocument>,
    private readonly userActivityService: UserActivityService,
  ) {}

  async searchProducts(
    queryDto: SearchQueryDto,
    user?: UserDocument,
  ): Promise<SearchResponseDto> {
    const { q } = queryDto;

    if (user && user.role !== UserRole.ADMIN) {
      this.userActivityService
        .trackActivity({
          userId: user._id,
          type: ActivityType.SEARCH,
          searchQuery: q,
        })
        .catch((err) =>
          this.logger.error('Failed to track search activity', err),
        );
    }

    let searchResult = await this._performSearch(q, queryDto, user);

    if (searchResult.total === 0) {
      const correctedQuery = await this._findCorrection(q);
      if (correctedQuery) {
        this.logger.log(
          `Original query "${q}" had no results. Trying suggestion "${correctedQuery}".`,
        );
        searchResult = await this._performSearch(
          correctedQuery,
          queryDto,
          user,
        );
        searchResult.suggestion = `Did you mean: ${correctedQuery}`;
      }
    }
    return searchResult;
  }

  // --- VVVVVV THIS IS THE UPDATED METHOD VVVVVV ---
  private async _performSearch(
    query: string,
    queryDto: SearchQueryDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user?: UserDocument,
  ): Promise<SearchResponseDto> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const escapedQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    // --- FIX: Use word boundaries `\b` to match whole words only ---
    // A query for "dress" will no longer match "dressing".
    // Split the query by spaces to match multiple whole words
    const queryWords = escapedQuery
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const regexps = queryWords.map(
      (word) => new RegExp('\\b' + word + '\\b', 'i'),
    );

    // The query now requires all words to be present in one of the fields
    const findQuery = {
      status: 'active',
      $and: regexps.map((regex) => ({
        $or: [
          { name: regex },
          { description: regex },
          { brand: regex },
          { model: regex },
          { specifications: regex },
          { tags: regex },
        ],
      })),
    };

    // If the user entered only one word, a simpler $or is sufficient
    const finalQuery =
      queryWords.length === 1
        ? { status: 'active', ...findQuery.$and[0] }
        : findQuery;

    const [results, total] = await Promise.all([
      this.productModel.find(finalQuery).skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(finalQuery),
    ]);

    const mappedData = results.map((product) =>
      this._mapProductToPublicResponse(product),
    );

    return {
      data: mappedData,
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }
  // --- ^^^^^^ END OF THE UPDATED METHOD ^^^^^^ ---

  private async _findFavoriteCategory(
    user?: UserDocument,
  ): Promise<Types.ObjectId | null> {
    if (!user) {
      return null;
    }
    const activity = await this.activityModel.findOne({ userId: user._id });
    if (
      !activity ||
      !activity.viewedProducts ||
      activity.viewedProducts.length === 0
    ) {
      return null;
    }

    const categoryCounts = await this.productModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { _id: { $in: activity.viewedProducts } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    return categoryCounts.length > 0 ? categoryCounts[0]._id : null;
  }

  async updateDictionary(): Promise<{ wordCount: number }> {
    this.logger.log('Starting search dictionary update...');
    const products = await this.productModel
      .find({}, 'name description brand model specifications tags')
      .exec();
    const wordSet = new Set<string>();

    const textFields: (keyof Pick<
      Product,
      'name' | 'description' | 'brand' | 'model' | 'specifications' | 'tags'
    >)[] = ['name', 'description', 'brand', 'model', 'specifications', 'tags'];

    for (const product of products) {
      for (const field of textFields) {
        const content = product[field];
        const textToProcess: string[] = [];
        if (typeof content === 'string') {
          textToProcess.push(content);
        } else if (Array.isArray(content)) {
          textToProcess.push(...content);
        }

        for (const text of textToProcess) {
          const words = text
            .toLowerCase()
            .split(/\s+/)
            .map((w) => w.replace(/[^a-z0-9]/gi, ''));
          for (const word of words) {
            if (word.length > 2) {
              wordSet.add(word);
            }
          }
        }
      }
    }

    const wordDocuments = Array.from(wordSet).map((word) => ({ word }));
    if (wordDocuments.length > 0) {
      await this.dictionaryModel.deleteMany({});
      await this.dictionaryModel
        .insertMany(wordDocuments, { ordered: false })
        .catch((err) => {
          const isMongoError = (error: unknown): error is { code: number } => {
            return (
              typeof error === 'object' && error !== null && 'code' in error
            );
          };
          if (!isMongoError(err) || err.code !== 11000) {
            this.logger.error('Error inserting words into dictionary', err);
          }
        });
    }
    const finalCount = wordDocuments.length;
    this.logger.log(
      `Dictionary update complete. Total unique words: ${finalCount}`,
    );
    return { wordCount: finalCount };
  }

  private async _findCorrection(query: string): Promise<string | null> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const dictionaryWords = (
      await this.dictionaryModel.find({}, 'word').exec()
    ).map((d) => d.word);
    if (dictionaryWords.length === 0) {
      this.logger.warn(
        'Search dictionary is empty. Cannot provide suggestions.',
      );
      return null;
    }
    let madeCorrection = false;
    const correctedWords = queryWords.map((word) => {
      let bestMatch = word;
      let minDistance = Infinity;
      if (word.length < 3) return word;
      for (const dictWord of dictionaryWords) {
        const distance = this._levenshteinDistance(word, dictWord);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = dictWord;
        }
      }
      if (minDistance > 0 && minDistance <= 2) {
        madeCorrection = true;
        return bestMatch;
      }
      return word;
    });
    return madeCorrection ? correctedWords.join(' ') : null;
  }

  private _levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      for (let j = 0; j <= n; j++) {
        dp[i][j] = 0;
      }
    }
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    return dp[m][n];
  }

  private _mapProductToPublicResponse(
    product: ProductDocument,
  ): PublicProductResponseDto {
    const productObj = product.toObject<Product & { _id: Types.ObjectId }>({
      versionKey: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media, images, orderCount, ...restOfProduct } = productObj;
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

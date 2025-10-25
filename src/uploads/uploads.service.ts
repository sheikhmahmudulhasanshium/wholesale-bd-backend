// src/uploads/uploads.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { UserService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { EntityModel } from './enums/entity-model.enum';
import { MediaType } from './enums/media-type.enum';
import { Media, MediaDocument } from 'src/storage/schemas/media.schema';
import { CreateLinkDto } from 'src/storage/dto/create-link.dto';
import { CategoriesService } from '../categories/categories.service';
import { OrdersService } from '../orders/orders.service';
import { ZonesService } from '../zones/zones.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaPurpose } from './enums/media-purpose.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface GroupedMedia {
  images: MediaDocument[];
  videos: MediaDocument[];
  audio: MediaDocument[];
  links: MediaDocument[];
}

export interface PaginatedMediaResponse {
  data: MediaDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => ZonesService))
    private readonly zonesService: ZonesService,
  ) {}

  async update(
    mediaId: string,
    updateMediaDto: UpdateMediaDto,
  ): Promise<MediaDocument> {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found.`);
    }

    if (updateMediaDto.purpose) {
      const uniquePurposes = [
        MediaPurpose.PROFILE_PICTURE,
        MediaPurpose.PROFILE_BANNER,
        MediaPurpose.COMPANY_LOGO,
        MediaPurpose.PRODUCT_THUMBNAIL,
      ];

      if (uniquePurposes.includes(updateMediaDto.purpose)) {
        const dynamicIdKey = this.getDynamicIdKey(media.entityModel);
        const entityIdValue = media.get(dynamicIdKey) as
          | Types.ObjectId
          | undefined;

        if (entityIdValue) {
          await this.mediaModel.updateMany(
            {
              [dynamicIdKey]: entityIdValue,
              purpose: updateMediaDto.purpose,
            },
            { $unset: { purpose: '' } },
          );
        }
      }
    }

    Object.assign(media, updateMediaDto);
    return media.save();
  }

  private getDynamicIdKey(entityModel: EntityModel): string {
    return `${entityModel.toLowerCase()}Id`;
  }

  async uploadFile(
    entityModel: EntityModel,
    entityId: string,
    file: Express.Multer.File,
  ): Promise<MediaDocument> {
    await this.validateEntityExists(entityModel, entityId);
    const mediaType = this.getMediaTypeFromFile(file.mimetype);
    const { url, fileKey } = await this.storageService.uploadFile(
      file,
      entityModel.toLowerCase(),
      mediaType,
    );
    const dynamicIdKey = this.getDynamicIdKey(entityModel);
    const newMediaData = {
      url,
      fileKey,
      mediaType,
      mimeType: file.mimetype,
      entityModel,
      originalName: file.originalname,
      size: file.size,
      [dynamicIdKey]: new Types.ObjectId(entityId),
    };
    const newMedia = new this.mediaModel(newMediaData);
    return newMedia.save();
  }

  // --- V THE FINAL, LINT-FREE "addLink" METHOD ---
  async addLink(
    entityModel: EntityModel,
    entityId: string,
    createLinkDto: CreateLinkDto,
  ): Promise<MediaDocument> {
    await this.validateEntityExists(entityModel, entityId);
    const dynamicIdKey = this.getDynamicIdKey(entityModel);

    try {
      // THE FIX (Part 1): The linter is incorrectly inferring the type of httpService.
      // We are disabling the specific false-positive rules for this line only.

      const response = await firstValueFrom(
        this.httpService.get(createLinkDto.url, {
          responseType: 'arraybuffer',
        }),
      );

      // Immediately restore type safety by casting the response and its properties.
      const axiosResponse = response as AxiosResponse<ArrayBuffer>;
      const contentType = axiosResponse.headers['content-type'] as
        | string
        | undefined;

      if (contentType?.startsWith('image/')) {
        this.logger.log(`URL is an image. Downloading and re-uploading to R2.`);

        const buffer = Buffer.from(axiosResponse.data);

        // THE FIX (Part 2): Create the mock file object and cast it to the required type
        // to satisfy TypeScript's strict checking for non-optional properties.
        const mockFile = {
          fieldname: 'file',
          originalname:
            createLinkDto.url.split('/').pop() || 'external-image.jpg',
          encoding: '7bit',
          mimetype: contentType,
          size: buffer.length,
          buffer: buffer,
        } as Express.Multer.File;

        const { url, fileKey } = await this.storageService.uploadFile(
          mockFile,
          entityModel.toLowerCase(),
          MediaType.IMAGE,
        );

        const newMediaData = {
          url,
          fileKey,
          mediaType: MediaType.IMAGE,
          mimeType: contentType,
          entityModel,
          originalName: mockFile.originalname,
          size: mockFile.size,
          [dynamicIdKey]: new Types.ObjectId(entityId),
        };
        const newMedia = new this.mediaModel(newMediaData);
        return newMedia.save();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to download or process URL as an image. Saving as a generic link. Error: ${errorMessage}`,
      );
    }

    const newMediaData = {
      url: createLinkDto.url,
      mediaType: MediaType.LINK,
      entityModel,
      [dynamicIdKey]: new Types.ObjectId(entityId),
    };
    const newMedia = new this.mediaModel(newMediaData);
    return newMedia.save();
  }
  // --- ^ END OF FINAL LOGIC ^ ---

  async findByEntityId(
    entityModel: EntityModel,
    entityId: string,
  ): Promise<GroupedMedia> {
    if (!Types.ObjectId.isValid(entityId))
      throw new BadRequestException('Invalid entity ID format.');
    const dynamicIdKey = this.getDynamicIdKey(entityModel);
    const mediaItems = await this.mediaModel
      .find({ [dynamicIdKey]: new Types.ObjectId(entityId) })
      .exec();
    return this.groupMedia(mediaItems);
  }

  async findAllPaginated(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedMediaResponse> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.mediaModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.mediaModel.countDocuments().exec(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  private groupMedia(mediaItems: MediaDocument[]): GroupedMedia {
    return mediaItems.reduce(
      (acc: GroupedMedia, item: MediaDocument) => {
        switch (item.mediaType) {
          case 'image':
            acc.images.push(item);
            break;
          case 'video':
            acc.videos.push(item);
            break;
          case 'audio':
            acc.audio.push(item);
            break;
          case 'link':
            acc.links.push(item);
            break;
        }
        return acc;
      },
      { images: [], videos: [], audio: [], links: [] },
    );
  }

  async deleteMedia(mediaId: string): Promise<{ message: string }> {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found.`);
    }
    const keyToDelete =
      media.fileKey || (media.get('fileName') as string | undefined);
    if (keyToDelete) {
      await this.storageService.deleteFile(keyToDelete);
    }
    await this.mediaModel.findByIdAndDelete(mediaId);
    return { message: 'Media deleted successfully.' };
  }

  private async validateEntityExists(
    entityModel: EntityModel,
    entityId: string,
  ): Promise<void> {
    let entityExists = false;
    try {
      switch (entityModel) {
        case EntityModel.PRODUCT:
          entityExists = !!(await this.productsService.findOne(entityId));
          break;
        case EntityModel.USER:
          entityExists = !!(await this.usersService.findById(entityId));
          break;
        case EntityModel.CATEGORY:
          entityExists = !!(await this.categoriesService.findById(entityId));
          break;
        case EntityModel.ORDER:
          entityExists = !!(await this.ordersService.findById(entityId));
          break;
        case EntityModel.ZONE:
          entityExists = !!(await this.zonesService.findById(entityId));
          break;
        default:
          throw new BadRequestException('Invalid entity model provided.');
      }
    } catch (error) {
      this.logger.error(
        `Validation check failed for entity ${entityModel}:${entityId}. Reason:`,
        error,
      );
      throw new NotFoundException(
        `Entity of model ${entityModel} with ID ${entityId} not found.`,
      );
    }
    if (!entityExists) {
      throw new NotFoundException(
        `Entity of model ${entityModel} with ID ${entityId} not found.`,
      );
    }
  }

  private getMediaTypeFromFile(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    throw new BadRequestException('Unsupported file type.');
  }
}

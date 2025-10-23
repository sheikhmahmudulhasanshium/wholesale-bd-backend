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
import { Model } from 'mongoose';
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

export interface GroupedMedia {
  images: MediaDocument[];
  videos: MediaDocument[];
  audio: MediaDocument[];
  links: MediaDocument[];
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
    private readonly storageService: StorageService,
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

  /**
   * Validates that the entity exists before associating media with it.
   */
  private async validateEntityExists(
    entityModel: EntityModel,
    entityId: string,
  ): Promise<void> {
    let entityExists = false;
    try {
      switch (entityModel) {
        case EntityModel.PRODUCT:
          // ProductsService uses findOne, which is fine, but findById is more standard for this use case.
          entityExists = !!(await this.productsService.findOne(entityId));
          break;
        case EntityModel.USER:
          entityExists = !!(await this.usersService.findById(entityId));
          break;
        // <-- MODIFIED: Standardized method calls to 'findById'.
        // This is a more common and descriptive name for finding a single document by its ID.
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

    const newMedia = new this.mediaModel({
      url,
      fileKey,
      mediaType,
      mimeType: file.mimetype,
      entityId,
      entityModel,
    });

    return newMedia.save();
  }

  async addLink(
    entityModel: EntityModel,
    entityId: string,
    createLinkDto: CreateLinkDto,
  ): Promise<MediaDocument> {
    await this.validateEntityExists(entityModel, entityId);

    const newMedia = new this.mediaModel({
      url: createLinkDto.url,
      mediaType: MediaType.LINK,
      entityId,
      entityModel,
    });

    return newMedia.save();
  }

  async findMediaForEntity(
    entityModel: EntityModel,
    entityId: string,
  ): Promise<GroupedMedia> {
    await this.validateEntityExists(entityModel, entityId);

    const mediaItems = await this.mediaModel
      .find({ entityId, entityModel })
      .exec();

    return mediaItems.reduce(
      (acc: GroupedMedia, item: MediaDocument) => {
        switch (item.mediaType) {
          case MediaType.IMAGE:
            acc.images.push(item);
            break;
          case MediaType.VIDEO:
            acc.videos.push(item);
            break;
          case MediaType.AUDIO:
            acc.audio.push(item);
            break;
          case MediaType.LINK:
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

    if (media.fileKey) {
      await this.storageService.deleteFile(media.fileKey);
    }

    await this.mediaModel.findByIdAndDelete(mediaId);

    return { message: 'Media deleted successfully.' };
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  User,
  UserDocument,
  UserRole,
  SellerStatus,
} from './schemas/user.schema';
import { UserResponseDto } from './dto/user-response.dto';
import { UnifiedPublicProfileDto } from './dto/unified-public-profile.dto';
import { GroupedMedia, UploadsService } from '../uploads/uploads.service';
import { EntityModel } from '../uploads/enums/entity-model.enum';
import { MediaPurpose } from '../uploads/enums/media-purpose.enum';
import { Media, MediaDocument } from '../storage/schemas/media.schema';
import { SetProfilePictureFromUrlDto } from './dto/set-profile-picture-from-url.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @Inject(forwardRef(() => UploadsService))
    private readonly uploadsService: UploadsService,
  ) {}

  async setProfileOrBannerPictureFromUrl(
    user: UserDocument,
    dto: SetProfilePictureFromUrlDto,
    purpose: MediaPurpose.PROFILE_PICTURE | MediaPurpose.PROFILE_BANNER,
  ): Promise<MediaDocument> {
    await this.mediaModel.updateMany(
      { userId: user._id, purpose: purpose },
      { $unset: { purpose: '' } },
    );

    const newMedia = await this.uploadsService.addLink(
      EntityModel.USER,
      user._id.toString(),
      dto,
    );

    newMedia.purpose = purpose;
    return newMedia.save();
  }

  async setProfileOrBannerPicture(
    user: UserDocument,
    file: Express.Multer.File,
    purpose: MediaPurpose.PROFILE_PICTURE | MediaPurpose.PROFILE_BANNER,
  ): Promise<MediaDocument> {
    await this.mediaModel.updateMany(
      { userId: user._id, purpose: purpose },
      { $unset: { purpose: '' } },
    );

    const newMedia = await this.uploadsService.uploadFile(
      EntityModel.USER,
      user._id.toString(),
      file,
    );

    newMedia.purpose = purpose;
    return newMedia.save();
  }

  async getMyUploads(userId: string): Promise<GroupedMedia> {
    return this.uploadsService.findByEntityId(EntityModel.USER, userId);
  }

  async create(user: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+password').exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }
  async countAll(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findUnifiedPublicProfileById(
    id: string,
  ): Promise<UnifiedPublicProfileDto | null> {
    const user = await this.userModel.findById(id).exec();

    if (!user || !user.isActive) {
      return null;
    }

    let finalProfilePicUrl = user.profilePicture || null;
    let finalBackgroundPicUrl: string | null = null;

    if (!finalProfilePicUrl) {
      try {
        const media = await this.uploadsService.findByEntityId(
          EntityModel.USER,
          user._id.toString(),
        );

        const profilePic = media.images.find(
          (img) => img.purpose === MediaPurpose.PROFILE_PICTURE,
        );
        if (profilePic) {
          finalProfilePicUrl = profilePic.url;
        }

        const backgroundPic = media.images.find(
          (img) => img.purpose === MediaPurpose.PROFILE_BANNER,
        );
        if (backgroundPic) {
          finalBackgroundPicUrl = backgroundPic.url;
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Could not fetch media for user ${id}. This is non-critical. Error: ${errorMessage}`,
        );
      }
    }

    const isPublicSeller =
      user.role === UserRole.SELLER &&
      user.sellerStatus === SellerStatus.APPROVED;
    const isPublicCustomer = user.role === UserRole.CUSTOMER;
    const isPublicAdmin = user.role === UserRole.ADMIN;

    if (isPublicSeller || isPublicCustomer || isPublicAdmin) {
      return UnifiedPublicProfileDto.fromUserDocument(
        user,
        finalProfilePicUrl,
        finalBackgroundPicUrl,
      );
    }

    return null;
  }

  async update(id: string, updates: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async delete(id: string): Promise<any> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return { message: 'User deleted successfully' };
  }

  async listUsers(
    role?: UserRole,
    kycStatus?: SellerStatus,
    page = 1,
    limit = 10,
  ): Promise<UserDocument[]> {
    const query: FilterQuery<User> = {};
    if (role) {
      query.role = role;
    }
    if (kycStatus) {
      query.sellerStatus = kycStatus;
    }
    return this.userModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async countUsers(role?: UserRole, kycStatus?: SellerStatus): Promise<number> {
    const query: FilterQuery<User> = {};
    if (role) {
      query.role = role;
    }
    if (kycStatus) {
      query.sellerStatus = kycStatus;
    }
    return this.userModel.countDocuments(query).exec();
  }

  async save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  }

  toUserResponseDto(user: UserDocument): UserResponseDto {
    return UserResponseDto.fromUserDocument(user);
  }
}

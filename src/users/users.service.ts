import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// FIX: Import FilterQuery from mongoose
import { Model, FilterQuery } from 'mongoose';
import {
  User,
  UserDocument,
  UserRole,
  SellerStatus,
} from './schemas/user.schema';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

  // --- vvvvvvv ADDED THIS METHOD vvvvvvv ---
  /**
   * Finds a user by ID and returns only public-safe fields.
   * A profile is considered public only if the user is an active, approved seller.
   * @param id The user's ID.
   * @returns A user document with a limited set of fields, or null if not found/not public.
   */
  async findPublicProfileById(id: string): Promise<UserDocument | null> {
    const publicFields = [
      'firstName',
      'profilePicture',
      'businessName',
      'businessDescription',
      'isTrustedUser',
      'trustScore',
      'reviewCount',
      'createdAt', // Needed for "memberSince" in the DTO
    ].join(' ');

    return this.userModel
      .findOne({
        _id: id,
        role: UserRole.SELLER,
        sellerStatus: SellerStatus.APPROVED,
        isActive: true,
      })
      .select(publicFields)
      .exec();
  }
  // --- ^^^^^^^ ADDED THIS METHOD ^^^^^^^ ---

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
    // SUGGESTION: Rename this parameter to `sellerStatus` for clarity
    kycStatus?: SellerStatus,
    page = 1,
    limit = 10,
  ): Promise<UserDocument[]> {
    // FIX: Replaced `any` with the correct Mongoose `FilterQuery<User>` type
    const query: FilterQuery<User> = {};
    if (role) {
      query.role = role;
    }
    if (kycStatus) {
      // This now correctly maps to the `sellerStatus` field in the User schema
      query.sellerStatus = kycStatus;
    }
    return this.userModel
      .find(query) // `query` is now a strongly-typed object
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async countUsers(
    role?: UserRole,
    // SUGGESTION: Rename this parameter to `sellerStatus` for clarity
    kycStatus?: SellerStatus,
  ): Promise<number> {
    // FIX: Replaced `any` with the correct Mongoose `FilterQuery<User>` type
    const query: FilterQuery<User> = {};
    if (role) {
      query.role = role;
    }
    if (kycStatus) {
      query.sellerStatus = kycStatus;
    }
    // `query` is now a strongly-typed object, satisfying the method's type requirements
    return this.userModel.countDocuments(query).exec();
  }

  async save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  }

  // --- DTO Conversion Helper ---
  toUserResponseDto(user: UserDocument): UserResponseDto {
    return UserResponseDto.fromUserDocument(user);
  }
}

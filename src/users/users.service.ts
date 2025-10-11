import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { User, UserDocument } from './schemas/user.schema';
import {
  UpdateProfileDto,
  AdminUpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import {
  RegisterDto,
  SellerRegistrationDto,
  SellerSocialRegistrationDto,
} from '../auth/dto/auth.dto';
import { EmailService } from '../common/email.service';
import { Role } from '../auth/enums/role.enum';

interface ParsedToken {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  uid: string;
  provider: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  // FIX: Use type assertions (`as string`) to definitively type the properties.
  private _parseDecodedToken(decodedToken: DecodedIdToken): ParsedToken {
    if (!decodedToken.email) {
      throw new BadRequestException(
        'Email not available from social provider.',
      );
    }
    const name = (decodedToken.name || '') as string;
    const [firstName, ...lastNameParts] = name.split(' ');
    const provider = decodedToken.firebase?.sign_in_provider || 'unknown';

    return {
      email: decodedToken.email,
      firstName: firstName || '',
      lastName: lastNameParts.join(' '),
      picture: decodedToken.picture,
      uid: decodedToken.uid,
      provider,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createUser(dto: RegisterDto, role: Role): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();

    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      role,
      emailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    return user.save();
  }

  async createSeller(dto: SellerRegistrationDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();

    const seller = new this.userModel({
      ...dto,
      password: hashedPassword,
      role: Role.SELLER,
      sellerStatus: 'pending',
      sellerAppliedAt: new Date(),
      emailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    return seller.save();
  }

  async createSellerWithSocial(
    decodedToken: DecodedIdToken,
    dto: SellerSocialRegistrationDto,
  ): Promise<UserDocument> {
    const tokenData = this._parseDecodedToken(decodedToken);

    const seller = new this.userModel({
      email: tokenData.email,
      firstName: tokenData.firstName,
      lastName: tokenData.lastName,
      profilePicture: tokenData.picture,
      firebaseUid: tokenData.uid,
      authProviders: [tokenData.provider],
      emailVerified: true,
      role: Role.SELLER,
      sellerStatus: 'pending',
      sellerAppliedAt: new Date(),
      ...dto,
    });
    return seller.save();
  }

  async findOrCreateSocialUser(
    decodedToken: DecodedIdToken,
  ): Promise<UserDocument> {
    const tokenData = this._parseDecodedToken(decodedToken);

    let user: UserDocument | null = await this.userModel.findOne({
      email: tokenData.email,
    });
    if (user) {
      if (!user.firebaseUid) user.firebaseUid = tokenData.uid;
      return user;
    }

    user = new this.userModel({
      email: tokenData.email,
      firstName: tokenData.firstName,
      lastName: tokenData.lastName,
      profilePicture: tokenData.picture,
      firebaseUid: tokenData.uid,
      authProviders: [tokenData.provider],
      emailVerified: true,
      role: Role.CUSTOMER,
    });
    return user.save();
  }

  async getProfile(userId: Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateDto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(query: UserQueryDto): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const { role, sellerStatus, search } = query;

    const filter: Record<string, any> = {};
    if (role) filter.role = role;
    if (sellerStatus) filter.sellerStatus = sellerStatus;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    const users: UserDocument[] = await this.userModel
      .find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.userModel.countDocuments(filter);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminUpdateUser(
    userId: string,
    updateDto: AdminUpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateDto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async approveSeller(sellerId: string): Promise<UserDocument> {
    const seller = await this.userModel.findById(sellerId);
    if (!seller || (seller.role as Role) !== Role.SELLER)
      throw new NotFoundException('Seller not found');

    seller.sellerStatus = 'approved';
    seller.sellerApprovedAt = new Date();
    await seller.save();

    if (seller.businessName) {
      await this.emailService.sendSellerApprovalEmail(
        seller.email,
        seller.firstName,
        seller.businessName,
      );
    }

    return seller;
  }

  async rejectSeller(sellerId: string, reason: string): Promise<UserDocument> {
    const seller = await this.userModel.findById(sellerId);
    if (!seller || (seller.role as Role) !== Role.SELLER)
      throw new NotFoundException('Seller not found');

    seller.sellerStatus = 'rejected';
    seller.sellerRejectionReason = reason;
    await seller.save();

    await this.emailService.sendSellerRejectionEmail(
      seller.email,
      seller.firstName,
      reason,
    );

    return seller;
  }

  async blockUser(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user.isActive)
      throw new BadRequestException('User is already blocked');
    user.isActive = false;
    await user.save();
    return user;
  }

  async unblockUser(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (user.isActive) throw new BadRequestException('User is already active');
    user.isActive = true;
    await user.save();
    return user;
  }
}

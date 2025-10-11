// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// FIX: Remove unused 'Types' import
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ValidateOtpDto,
  SellerRegistrationDto,
  SellerSocialRegistrationDto,
} from './dto/auth.dto';
import { EmailService } from '../common/email.service';
import { UsersService } from '../users/users.service';
import { Role } from './enums/role.enum';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length > 0) return;
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        '\n',
      );
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        privateKey
      ) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
        console.log('Firebase Admin initialized successfully.');
      } else {
        console.warn(
          'Firebase credentials not found in env. Social login will be disabled.',
        );
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  private isFirebaseEnabled(): boolean {
    return admin.apps.length > 0;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const user = await this.usersService.createUser(registerDto, Role.CUSTOMER);
    if (user.emailVerificationOtp) {
      await this.emailService.sendEmailVerification(
        user.email,
        user.emailVerificationOtp,
        user.firstName,
      );
    }
    return this.generateAuthResponse(user);
  }

  async registerSeller(
    sellerDto: SellerRegistrationDto,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.userModel.findOne({
      email: sellerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const seller = await this.usersService.createSeller(sellerDto);
    if (seller.emailVerificationOtp) {
      await this.emailService.sendEmailVerification(
        seller.email,
        seller.emailVerificationOtp,
        seller.firstName,
      );
    }
    return this.generateAuthResponse(seller);
  }

  async registerSellerWithSocial(
    sellerSocialDto: SellerSocialRegistrationDto,
  ): Promise<AuthResponseDto> {
    if (!this.isFirebaseEnabled()) {
      throw new BadRequestException('Social registration is not available.');
    }
    const decodedToken: DecodedIdToken = await admin
      .auth()
      .verifyIdToken(sellerSocialDto.idToken);
    if (!decodedToken.email) {
      throw new BadRequestException('Email is required from social provider.');
    }
    const existingUser = await this.userModel.findOne({
      email: decodedToken.email,
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }
    const seller = await this.usersService.createSellerWithSocial(
      decodedToken,
      sellerSocialDto,
    );
    return this.generateAuthResponse(seller);
  }

  async loginWithEmailPassword(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }
    user.lastLogin = new Date();
    await user.save();
    return this.generateAuthResponse(user);
  }

  async loginWithSocial(idToken: string): Promise<AuthResponseDto> {
    if (!this.isFirebaseEnabled()) {
      throw new BadRequestException('Social login is not available.');
    }
    const decodedToken: DecodedIdToken = await admin
      .auth()
      .verifyIdToken(idToken);
    const user = await this.usersService.findOrCreateSocialUser(decodedToken);
    user.lastLogin = new Date();
    await user.save();
    return this.generateAuthResponse(user);
  }

  async forgotPassword(
    forgotDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: forgotDto.email });
    if (user) {
      const otp = this.usersService['generateOtp']();
      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      await this.emailService.sendPasswordResetEmail(user.email, otp);
    }
    return {
      message:
        'If an account with that email exists, a password reset OTP has been sent.',
    };
  }

  async resetPassword(
    resetDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      email: resetDto.email,
      resetPasswordOtp: resetDto.otp,
      resetPasswordOtpExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Invalid or expired OTP');
    user.password = await bcrypt.hash(resetDto.newPassword, 12);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();
    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(
    userId: string,
    changeDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.password) throw new NotFoundException('User not found.');
    const isMatch = await bcrypt.compare(
      changeDto.currentPassword,
      user.password,
    );
    if (!isMatch) throw new BadRequestException('Incorrect current password.');
    user.password = await bcrypt.hash(changeDto.newPassword, 12);
    await user.save();
    return { message: 'Password changed successfully.' };
  }

  async verifyEmail(verifyDto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      email: verifyDto.email,
      emailVerificationOtp: verifyDto.otp,
      emailVerificationOtpExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Invalid or expired OTP');
    user.emailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save();
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(
    resendDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: resendDto.email });
    if (user && !user.emailVerified) {
      const otp = this.usersService['generateOtp']();
      user.emailVerificationOtp = otp;
      user.emailVerificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      await this.emailService.sendEmailVerification(
        user.email,
        otp,
        user.firstName,
      );
    }
    return {
      message:
        'If an account with that email exists and is not verified, a new verification OTP has been sent.',
    };
  }

  async validateOtp(validateDto: ValidateOtpDto): Promise<{ valid: boolean }> {
    const user = await this.userModel.findOne({ email: validateDto.email });
    if (!user) return { valid: false };
    if (validateDto.type === 'email_verification') {
      return {
        valid: !!(
          user.emailVerificationOtp === validateDto.otp &&
          user.emailVerificationOtpExpires &&
          user.emailVerificationOtpExpires > new Date()
        ),
      };
    }
    if (validateDto.type === 'password_reset') {
      return {
        valid: !!(
          user.resetPasswordOtp === validateDto.otp &&
          user.resetPasswordOtpExpires &&
          user.resetPasswordOtpExpires > new Date()
        ),
      };
    }
    return { valid: false };
  }

  private generateAuthResponse(user: UserDocument): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const userProfile = user.toObject<User>();
    delete userProfile.password;
    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
    };
  }
}

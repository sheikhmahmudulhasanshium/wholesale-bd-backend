import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../users/users.service';
import {
  User,
  UserDocument,
  UserRole,
  SellerStatus,
} from '../users/schemas/user.schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { SellerRegisterDto } from './dto/seller-register.dto';
import { generate } from 'otp-generator';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

// Define TTL for OTP and password reset tokens in milliseconds
const OTP_TTL = 10 * 60 * 1000; // 10 minutes
const PASSWORD_RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Store OTPs and reset tokens in-memory for simplicity.
  // In a real-world, distributed application, use Redis or a database.
  private otpStore: Map<
    string,
    { otp: string; expiresAt: number; userId?: string }
  > = new Map();
  private passwordResetTokens: Map<
    string,
    { email: string; expiresAt: number }
  > = new Map();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  private generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  // --- Highest Priority Endpoints ---

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      if (
        existingUser.authProviders.length > 0 &&
        existingUser.authProviders[0] !== 'email'
      ) {
        throw new ConflictException(
          `Email already registered via ${existingUser.authProviders[0]}. Please use that method to log in.`,
        );
      } else if (existingUser.password) {
        throw new ConflictException('Email already registered.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const expiresAt = Date.now() + OTP_TTL;

    // FIX: Use a double-cast to `unknown` then `UserDocument` to satisfy strict linting.
    const newUser = (await this.userService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerified: false, // Must be verified via OTP
      role: UserRole.CUSTOMER, // Default role
      authProviders: ['email'],
    })) as unknown as UserDocument;

    this.otpStore.set(email, {
      otp,
      expiresAt,
      userId: String(newUser._id),
    });
    await this.mailService.sendVerificationEmail(email, otp);
    this.logger.log(`OTP ${otp} sent to ${email} for registration.`);

    const payload: JwtPayload = {
      userId: String(newUser._id),
      email: newUser.email,
      role: newUser.role,
    };
    const token = this.generateToken(payload);

    return { user: this.userService.toUserResponseDto(newUser), token };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Invalid credentials or account not registered with email/password.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact support.',
      );
    }

    if (!user.emailVerified) {
      const otp = generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
      const expiresAt = Date.now() + OTP_TTL;
      this.otpStore.set(email, { otp, expiresAt, userId: String(user._id) });
      await this.mailService.sendVerificationEmail(email, otp);
      this.logger.warn(
        `User ${email} tried to log in, but email not verified. OTP re-sent.`,
      );
      throw new UnauthorizedException(
        'Email not verified. An OTP has been sent to your email for verification.',
      );
    }

    user.lastLogin = new Date();
    await this.userService.save(user);

    const payload: JwtPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const token = this.generateToken(payload);

    return { user: this.userService.toUserResponseDto(user), token };
  }

  async validateOAuthUser(oauthUser: {
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    googleId?: string;
    firebaseUid?: string;
    authProviders: string[];
    emailVerified: boolean;
    role: UserRole;
  }): Promise<UserDocument> {
    let user = await this.userService.findByEmail(oauthUser.email);

    if (user) {
      if (!user.authProviders.includes(oauthUser.authProviders[0])) {
        if (user.password && user.authProviders.includes('email')) {
          throw new ConflictException(
            `Email already registered with email/password. Please log in with your password.`,
          );
        }
        user.authProviders.push(oauthUser.authProviders[0]);
        if (oauthUser.googleId) user.googleId = oauthUser.googleId;
        if (oauthUser.firebaseUid) user.firebaseUid = oauthUser.firebaseUid;
        await this.userService.save(user);
        this.logger.log(
          `Added new auth provider ${oauthUser.authProviders[0]} to user ${user.email}`,
        );
      }
      user.lastLogin = new Date();
      await this.userService.save(user);
    } else {
      // FIX: Use a double-cast here as well.
      user = (await this.userService.create(
        oauthUser,
      )) as unknown as UserDocument;
      this.logger.log(`New user registered via OAuth: ${user.email}`);
    }
    return user;
  }

  googleLogin(req: { user?: UserDocument }): {
    user: UserResponseDto;
    token: string;
  } {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const user = req.user;
    const payload: JwtPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return { user: this.userService.toUserResponseDto(user), token };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return this.userService.toUserResponseDto(user);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.warn(
        `Forgot password request for non-existent email: ${email}`,
      );
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = generate(20, {
      upperCaseAlphabets: true,
      specialChars: false,
    });
    const expiresAt = Date.now() + PASSWORD_RESET_TOKEN_TTL;

    this.passwordResetTokens.set(resetToken, { email, expiresAt });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      this.logger.error('FRONTEND_URL environment variable not set.');
      throw new InternalServerErrorException(
        'Application is not configured correctly.',
      );
    }
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.mailService.sendPasswordResetEmail(email, resetLink);
    this.logger.log(`Password reset link sent to ${email}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const tokenData = this.passwordResetTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await this.userService.findByEmailWithPassword(
      tokenData.email,
    );
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userService.save(user);

    this.passwordResetTokens.delete(token);
    this.logger.log(`Password reset for user ${user.email} successful.`);

    return { message: 'Password has been reset successfully.' };
  }

  async validateOtp(
    validateOtpDto: ValidateOtpDto,
  ): Promise<{ message: string; user?: UserResponseDto }> {
    const { email, otp } = validateOtpDto;
    const storedOtpData = this.otpStore.get(email);

    if (!storedOtpData || storedOtpData.otp !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }
    if (storedOtpData.expiresAt < Date.now()) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired.');
    }

    if (!storedOtpData.userId) {
      throw new BadRequestException('OTP data is invalid or corrupted.');
    }
    const user = await this.userService.findById(storedOtpData.userId);

    if (!user) {
      throw new NotFoundException('User associated with OTP not found.');
    }

    if (user.emailVerified) {
      this.otpStore.delete(email);
      return { message: 'Email already verified.' };
    }

    user.emailVerified = true;
    await this.userService.save(user);
    this.otpStore.delete(email);
    this.logger.log(`Email ${email} verified successfully.`);

    return {
      message: 'Email verified successfully.',
      user: this.userService.toUserResponseDto(user),
    };
  }

  // --- Medium Priority Endpoints ---

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.userService.findByIdWithPassword(userId);
    if (!user || !user.password) {
      throw new NotFoundException(
        'User not found or no password set (e.g., OAuth user).',
      );
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Incorrect old password.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userService.save(user);
    this.logger.log(`User ${user.email} changed password.`);

    return { message: 'Password changed successfully.' };
  }

  async verifyEmail(
    verifyEmailDto: ValidateOtpDto,
  ): Promise<{ message: string; user?: UserResponseDto }> {
    const { email } = verifyEmailDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const otp = generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const expiresAt = Date.now() + OTP_TTL;
    this.otpStore.set(email, { otp, expiresAt, userId: String(user._id) });
    await this.mailService.sendVerificationEmail(email, otp);
    this.logger.log(`New OTP ${otp} sent to ${email} for email verification.`);

    return {
      message:
        'Verification OTP has been re-sent to your email. Please use `auth/validate-otp` to complete verification.',
    };
  }

  async sellerRegister(
    sellerRegisterDto: SellerRegisterDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const {
      email,
      password,
      firstName,
      lastName,
      businessName,
      businessLicense,
      businessDescription,
      zone,
    } = sellerRegisterDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      if (existingUser.role === UserRole.SELLER) {
        throw new ConflictException('Email is already registered as a seller.');
      }
      if (
        existingUser.authProviders.length > 0 &&
        existingUser.authProviders[0] !== 'email'
      ) {
        throw new ConflictException(
          `Email already registered via ${existingUser.authProviders[0]}. Please use that method to log in.`,
        );
      }
      if (existingUser.role === UserRole.CUSTOMER) {
        if (!existingUser.password) {
          throw new BadRequestException(
            'Existing customer account was registered via OAuth and does not have a password. Please register as a seller with an email/password or convert your existing account through profile settings.',
          );
        }
        existingUser.role = UserRole.SELLER;
        existingUser.sellerStatus = SellerStatus.PENDING;
        existingUser.businessName = businessName;
        existingUser.businessLicense = businessLicense;
        existingUser.businessDescription = businessDescription;
        existingUser.zone = zone;
        existingUser.sellerAppliedAt = new Date();
        // FIX: Use a double-cast here.
        const updatedUser = (await this.userService.save(
          existingUser,
        )) as unknown as UserDocument;

        const payload: JwtPayload = {
          userId: String(updatedUser._id),
          email: updatedUser.email,
          role: updatedUser.role,
        };
        const token = this.generateToken(payload);
        return { user: this.userService.toUserResponseDto(updatedUser), token };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // FIX: Use a double-cast here.
    const newUser = (await this.userService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerified: false,
      role: UserRole.SELLER,
      sellerStatus: SellerStatus.PENDING,
      businessName,
      businessLicense,
      businessDescription,
      zone,
      sellerAppliedAt: new Date(),
      authProviders: ['email'],
    })) as unknown as UserDocument;

    const otp = generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const expiresAt = Date.now() + OTP_TTL;
    this.otpStore.set(email, {
      otp,
      expiresAt,
      userId: String(newUser._id),
    });
    await this.mailService.sendVerificationEmail(email, otp);
    this.logger.log(`Seller OTP ${otp} sent to ${email} for registration.`);

    const payload: JwtPayload = {
      userId: String(newUser._id),
      email: newUser.email,
      role: newUser.role,
    };
    const token = this.generateToken(payload);

    return { user: this.userService.toUserResponseDto(newUser), token };
  }

  // --- Lower Priority Endpoints (Admin) ---

  async listUsers(role?: UserRole): Promise<UserResponseDto[]> {
    const users = await this.userService.listUsers(role);
    return users.map((user) => this.userService.toUserResponseDto(user));
  }

  async listSellers(): Promise<UserResponseDto[]> {
    const sellers = await this.userService.listUsers(UserRole.SELLER);
    return sellers.map((seller) => this.userService.toUserResponseDto(seller));
  }

  async listPendingSellers(): Promise<UserResponseDto[]> {
    const pendingSellers = await this.userService.listUsers(
      UserRole.SELLER,
      SellerStatus.PENDING,
    );
    return pendingSellers.map((seller) =>
      this.userService.toUserResponseDto(seller),
    );
  }

  async approveSeller(id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Seller not found.');
    }
    if (user.role !== UserRole.SELLER) {
      throw new BadRequestException('User is not a seller.');
    }
    if (user.sellerStatus === SellerStatus.APPROVED) {
      throw new BadRequestException('Seller is already approved.');
    }

    user.sellerStatus = SellerStatus.APPROVED;
    user.sellerApprovedAt = new Date();
    user.isTrustedUser = true;
    user.trustedUserSince = new Date();
    await this.userService.save(user);
    this.logger.log(`Seller ${user.email} (ID: ${id}) approved.`);

    return this.userService.toUserResponseDto(user);
  }

  async rejectSeller(id: string, reason?: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Seller not found.');
    }
    if (user.role !== UserRole.SELLER) {
      throw new BadRequestException('User is not a seller.');
    }
    if (user.sellerStatus === SellerStatus.REJECTED) {
      throw new BadRequestException('Seller is already rejected.');
    }

    user.sellerStatus = SellerStatus.REJECTED;
    this.logger.warn(
      `Seller ${user.email} (ID: ${id}) rejected. Reason: ${reason || 'No reason provided.'}`,
    );
    await this.userService.save(user);

    return this.userService.toUserResponseDto(user);
  }

  async blockUser(id: string, reason?: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.isActive) {
      throw new BadRequestException('User is already blocked.');
    }

    user.isActive = false;
    this.logger.warn(
      `User ${user.email} (ID: ${id}) blocked. Reason: ${reason || 'No reason provided.'}`,
    );
    await this.userService.save(user);

    return this.userService.toUserResponseDto(user);
  }

  async unblockUser(id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.isActive) {
      throw new BadRequestException('User is not blocked.');
    }

    user.isActive = true;
    this.logger.log(`User ${user.email} (ID: ${id}) unblocked.`);
    await this.userService.save(user);

    return this.userService.toUserResponseDto(user);
  }
}

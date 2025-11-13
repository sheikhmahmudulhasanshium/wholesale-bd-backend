// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Param,
  Put,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { SellerRegisterDto } from './dto/seller-register.dto';
import { RejectSellerDto } from './dto/approve-reject-seller.dto';
import { AuthGuard } from '@nestjs/passport';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BlockUserDto } from './dto/block-unblock.dto';
import { ConfigService } from '@nestjs/config';
import { ManualVerifyDto } from './dto/manual-verify.dto';
import { UpdateRoleDto } from './dto/update-role.dto'; // --- V NEW: Import DTO ---

interface RequestWithUser extends Request {
  user: UserDocument;
}

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // --- Highest Priority Endpoints ---

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully, OTP sent.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists or registered via OAuth.',
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user with email and password' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified.',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback URL' })
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: RequestWithUser, @Res() res: Response) {
    const { token } = this.authService.googleLogin(req);
    const frontendUrl = this.configService.get<string>('frontendUrl');
    if (!frontendUrl) {
      return res
        .status(500)
        .send('Configuration error: Frontend URL is not set.');
    }
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@CurrentUser() user: UserDocument) {
    return this.authService.getProfile(user._id.toString());
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link for a given email' })
  @ApiResponse({
    status: 200,
    description: 'If an account exists, a reset link will be sent.',
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password using a valid token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('validate-otp')
  @ApiOperation({ summary: 'Validate OTP to verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  @HttpCode(HttpStatus.OK)
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    return this.authService.validateOtp(validateOtpDto);
  }

  // --- Medium Priority Endpoints ---

  @Put('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change the password of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or incorrect old password.',
  })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );
  }

  @Post('verify-email')
  @ApiOperation({
    summary:
      'Request a new OTP to verify email or re-send if existing OTP failed',
  })
  @ApiResponse({ status: 200, description: 'Verification OTP sent/re-sent.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('seller/register')
  @ApiOperation({
    summary:
      'Register a new seller account or convert existing customer to seller (pending approval)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Seller registration initiated, OTP sent (if new user) or status updated (if existing customer).',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered as seller or via OAuth.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Existing customer with OAuth tried to register as seller with password.',
  })
  @HttpCode(HttpStatus.CREATED)
  async sellerRegister(@Body() sellerRegisterDto: SellerRegisterDto) {
    return this.authService.sellerRegister(sellerRegisterDto);
  }

  // --- Lower Priority Endpoints (Admin Specific) ---

  @Post('admin/manual-verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Admin: Manually verify a user's email address." })
  @ApiResponse({
    status: 200,
    description: 'User email verified successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @HttpCode(HttpStatus.OK)
  async manualVerifyUser(@Body() manualVerifyDto: ManualVerifyDto) {
    return this.authService.manualVerifyUser(manualVerifyDto.email);
  }

  // --- V NEW: Secure Admin Endpoint to Update User Role ---
  @Put('admin/user/:id/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Admin: Update a user's role.",
    description:
      "This is an administrative tool to change a user's role (e.g., promote a customer to a seller).",
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid role or user already has the role.',
  })
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.authService.updateUserRole(userId, updateRoleDto.role);
  }
  // --- ^ END of NEW ---

  @Get('admin/users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: List all users (customers, sellers, admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async listAllUsers() {
    return this.authService.listUsers();
  }

  @Get('admin/sellers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: List all registered sellers (approved, pending, rejected)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all sellers.',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async listSellers() {
    return this.authService.listSellers();
  }

  @Get('admin/sellers/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all pending seller applications' })
  @ApiResponse({
    status: 200,
    description: 'List of pending sellers.',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async listPendingSellers() {
    return this.authService.listPendingSellers();
  }

  @Put('admin/seller/:id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Approve a seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller approved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({
    status: 400,
    description: 'User is not a seller or already approved.',
  })
  async approveSeller(@Param('id') id: string) {
    return this.authService.approveSeller(id);
  }

  @Put('admin/seller/:id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reject a seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller rejected successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({
    status: 400,
    description: 'User is not a seller or already rejected.',
  })
  async rejectSeller(
    @Param('id') id: string,
    @Body() rejectDto: RejectSellerDto,
  ) {
    return this.authService.rejectSeller(id, rejectDto.reason);
  }

  @Put('admin/user/:id/block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Block a user account' })
  @ApiResponse({
    status: 200,
    description: 'User blocked successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'User already blocked.' })
  async blockUser(@Param('id') id: string, @Body() blockUserDto: BlockUserDto) {
    return this.authService.blockUser(id, blockUserDto.reason);
  }

  @Put('admin/user/:id/unblock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Unblock a user account' })
  @ApiResponse({
    status: 200,
    description: 'User unblocked successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'User not blocked.' })
  async unblockUser(@Param('id') id: string) {
    return this.authService.unblockUser(id);
  }
}

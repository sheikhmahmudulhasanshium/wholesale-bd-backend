import { Controller, Post, Body, UseGuards, Put, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import {
  RegisterDto,
  LoginDto,
  SocialLoginDto,
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CurrentUser } from './decorators/user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('seller/register')
  @ApiOperation({ summary: 'Register a new seller account (pending approval)' })
  @ApiResponse({
    status: 201,
    description: 'Seller application submitted.',
    type: AuthResponseDto,
  })
  async registerSeller(
    @Body() sellerDto: SellerRegistrationDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerSeller(sellerDto);
  }

  @Post('seller/register/social')
  @ApiOperation({
    summary: 'Register a new seller using a social account (pending approval)',
  })
  @ApiResponse({
    status: 201,
    description: 'Seller application submitted via social account.',
    type: AuthResponseDto,
  })
  async registerSellerWithSocial(
    @Body() sellerSocialDto: SellerSocialRegistrationDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerSellerWithSocial(sellerSocialDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    type: AuthResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithEmailPassword(loginDto);
  }

  @Post('social-login')
  @ApiOperation({
    summary: 'Log in or register using a social provider (Google, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Social login successful.',
    type: AuthResponseDto,
  })
  async socialLogin(@Body() body: SocialLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithSocial(body.idToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Initiate the password reset process' })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent if user exists.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using an OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password has been reset successfully.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email using an OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend the email verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'New verification OTP sent if applicable.',
  })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendDto);
  }

  @Post('validate-otp')
  @ApiOperation({ summary: 'Validate an OTP without completing an action' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether the OTP is valid.',
  })
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    return this.authService.validateOtp(validateOtpDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('change-password')
  @ApiOperation({ summary: 'Change password for a logged-in user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get the profile of the currently logged-in user' })
  @ApiResponse({ status: 200, description: 'Profile data retrieved.' })
  getProfile(@CurrentUser() user: UserDocument): Omit<User, 'password'> {
    // FIX: Use the generic on `.toObject<User>()` to get a strongly typed plain object.
    // This eliminates the `any` type and solves all related ESLint errors.
    const userProfile = user.toObject<User>();

    // This is now a safe operation.
    delete userProfile.password;

    // This is now a safe return.
    return userProfile;
  }
}

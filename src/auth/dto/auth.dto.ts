import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() readonly email: string;
  @ApiProperty() @IsString() @MinLength(6) readonly password: string;
  @ApiProperty() @IsString() readonly firstName: string;
  @ApiProperty() @IsString() readonly lastName: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() readonly email: string;
  @ApiProperty() @IsString() readonly password: string;
}

export class SocialLoginDto {
  @ApiProperty() @IsString() readonly idToken: string;
}

export class AuthResponseDto {
  @ApiProperty() readonly access_token: string;
  @ApiProperty() readonly user: Record<string, any>;
}

export class ForgotPasswordDto {
  @ApiProperty() @IsEmail() readonly email: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsEmail() readonly email: string;
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(6) readonly otp: string;
  @ApiProperty() @IsString() @MinLength(6) readonly newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() readonly currentPassword: string;
  @ApiProperty() @IsString() @MinLength(6) readonly newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty() @IsEmail() readonly email: string;
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(6) readonly otp: string;
}

export class ResendVerificationDto {
  @ApiProperty() @IsEmail() readonly email: string;
}

export class ValidateOtpDto {
  @ApiProperty() @IsEmail() readonly email: string;
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(6) readonly otp: string;
  @ApiProperty({ enum: ['email_verification', 'password_reset'] })
  @IsEnum(['email_verification', 'password_reset'])
  readonly type: 'email_verification' | 'password_reset';
}

export class SellerRegistrationDto extends RegisterDto {
  @ApiProperty() @IsString() readonly businessName: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly businessLicense?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly businessDescription?: string;
  @ApiProperty() @IsString() readonly zone: string; // Zone ID
}

export class SellerSocialRegistrationDto {
  @ApiProperty() @IsString() readonly idToken: string;
  @ApiProperty() @IsString() readonly businessName: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly businessLicense?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly businessDescription?: string;
  @ApiProperty() @IsString() readonly zone: string; // Zone ID
}

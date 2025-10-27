import { ApiProperty } from '@nestjs/swagger';
import {
  UserDocument,
  UserRole,
  KycStatus,
  SellerStatus,
} from '../schemas/user.schema';

/**
 * Data Transfer Object for a full user profile response.
 * This DTO includes sensitive and detailed information and should only be used
 * in authenticated and authorized endpoints (e.g., for an admin or the user themselves).
 */
export class UserResponseDto {
  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a47',
    description: 'The unique identifier of the user.',
  })
  _id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: "User's email address.",
  })
  email: string;

  @ApiProperty({ example: 'John', description: "User's first name." })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "User's last name." })
  lastName: string;

  @ApiProperty({
    required: false,
    example: '+15551234567',
    description: "User's phone number.",
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: "URL to the user's profile picture.",
  })
  profilePicture?: string;

  @ApiProperty({
    example: '123 Main St, Anytown, USA',
    required: false,
    description: "User's physical address.",
  })
  address?: string;

  @ApiProperty({
    example: 'North America',
    required: false,
    description: "User's geographical zone or region.",
  })
  zone?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is active.',
  })
  isActive: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user has verified their email address.',
  })
  emailVerified: boolean;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.SELLER,
    description: 'The role assigned to the user.',
  })
  role: UserRole;

  @ApiProperty({
    enum: KycStatus,
    example: KycStatus.APPROVED,
    description: 'The Know Your Customer (KYC) verification status.',
  })
  kycStatus: KycStatus;

  @ApiProperty({
    enum: SellerStatus,
    example: SellerStatus.APPROVED,
    description: "The user's status as a seller.",
  })
  sellerStatus: SellerStatus;

  @ApiProperty({
    required: false,
    example: 'Doe Electronics',
    description: "The user's business name.",
  })
  businessName?: string;

  @ApiProperty({
    required: false,
    example: 'Specializing in vintage audio equipment.',
    description: 'A description of the user/business.',
  })
  businessDescription?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is a trusted seller.',
  })
  isTrustedUser: boolean;

  @ApiProperty({
    example: 85,
    description: 'A calculated score representing user trustworthiness.',
  })
  trustScore: number;

  @ApiProperty({
    example: 12,
    description: 'Total number of reviews the user has received.',
  })
  reviewCount: number;

  @ApiProperty({
    example: 5,
    description: 'Total number of submissions made by the user.',
  })
  submissionCount: number;

  @ApiProperty({
    example: '2023-01-15T10:00:00.000Z',
    description: 'The date the user created their account.',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-20T12:30:00.000Z',
    description: 'The date the user profile was last updated.',
  })
  updatedAt: Date;

  @ApiProperty({
    required: false,
    example: '2024-03-20T12:00:00.000Z',
    description: 'Timestamp of the last login.',
  })
  lastLogin?: Date;

  static fromUserDocument(userDoc: UserDocument): UserResponseDto {
    const dto = new UserResponseDto();
    dto._id = userDoc._id.toString();
    dto.email = userDoc.email;
    dto.firstName = userDoc.firstName;
    dto.lastName = userDoc.lastName;
    dto.phone = userDoc.phone;
    dto.profilePicture = userDoc.profilePicture;
    dto.address = userDoc.address;
    dto.zone = userDoc.zone;
    dto.isActive = userDoc.isActive;
    dto.emailVerified = userDoc.emailVerified;
    dto.role = userDoc.role;
    dto.kycStatus = userDoc.kycStatus;
    dto.sellerStatus = userDoc.sellerStatus;
    dto.businessName = userDoc.businessName;
    dto.businessDescription = userDoc.businessDescription;
    dto.isTrustedUser = userDoc.isTrustedUser;
    dto.trustScore = userDoc.trustScore;
    dto.reviewCount = userDoc.reviewCount;
    dto.submissionCount = userDoc.submissionCount;
    dto.lastLogin = userDoc.lastLogin;
    dto.createdAt = userDoc.createdAt;
    dto.updatedAt = userDoc.updatedAt;
    return dto;
  }
}

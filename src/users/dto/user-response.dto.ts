import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a47',
    description: 'The unique identifier of the user',
  })
  _id: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'The email address of the user',
  })
  email: string;

  @ApiProperty({ example: 'John', description: "User's first name" })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "User's last name" })
  lastName: string;

  @ApiProperty({
    required: false,
    example: '+8801712345678',
    description: "User's phone number",
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: "URL to the user's profile picture",
  })
  profilePicture?: string;

  @ApiProperty({ required: false, description: "User's physical address" })
  address?: string;

  @ApiProperty({
    required: false,
    example: 'Dhaka',
    description: "User's business zone",
  })
  zone?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: "Indicates if the user's email has been verified",
  })
  emailVerified: boolean;

  @ApiProperty({
    example: 'seller',
    description: 'The role of the user (e.g., admin, seller, customer)',
  })
  role: string;

  @ApiProperty({
    example: 'pending',
    description: 'KYC (Know Your Customer) verification status',
  })
  kycStatus: string;

  @ApiProperty({
    example: 'approved',
    description: 'Seller application status',
  })
  sellerStatus: string;

  @ApiProperty({
    required: false,
    example: 'Doe Electronics',
    description: "User's business name",
  })
  businessName?: string;

  @ApiProperty({
    example: 85,
    description: 'A calculated score representing user trustworthiness',
  })
  trustScore: number;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is a trusted seller',
  })
  isTrustedUser: boolean;

  @ApiProperty({ description: 'Timestamp of user creation' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last user update' })
  updatedAt: Date;

  @ApiProperty({
    required: false,
    description: "Timestamp of the user's last login",
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
    dto.trustScore = userDoc.trustScore;
    dto.isTrustedUser = userDoc.isTrustedUser;
    dto.createdAt = userDoc.createdAt;
    dto.updatedAt = userDoc.updatedAt;
    dto.lastLogin = userDoc.lastLogin;
    return dto;
  }
}

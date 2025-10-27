import { ApiProperty } from '@nestjs/swagger';
import { UserDocument, UserRole, SellerStatus } from '../schemas/user.schema';

/**
 * A unified DTO for any public-facing user profile.
 * Its content is dynamically populated based on the user's role to ensure
 * security, privacy, and e-commerce functionality.
 */
export class UnifiedPublicProfileDto {
  @ApiProperty({
    example: '68f4529b0b588f71ad0fa1ae',
    description: 'The unique identifier of the user.',
  })
  _id: string;

  @ApiProperty({
    example: 'Rahman Electronics Ltd',
    description:
      "The user's public display name. For sellers, this is their business name. For customers and admins, it's a privacy-safe name.",
  })
  displayName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.SELLER,
    description:
      'The public role of the user, which determines the shape of the profile data.',
  })
  role: UserRole;

  @ApiProperty({
    required: false,
    example: 'Ahmed Rahman',
    description:
      "The seller's public contact name. Only available for sellers.",
  })
  contactName?: string;

  @ApiProperty({
    required: false,
    example: 'seller1@example.com',
    description:
      "The seller's public contact email. Only available for sellers.",
  })
  email?: string;

  @ApiProperty({
    required: false,
    example: '+8801711111111',
    description:
      "The seller's public contact phone number. Only available for sellers.",
  })
  phone?: string;

  @ApiProperty({
    required: false,
    example: 'Dhanmondi, Dhaka',
    description:
      "The seller's public store location or address. Only available for sellers.",
  })
  address?: string;

  @ApiProperty({
    required: false,
    description: "URL to the user's profile picture or business logo.",
  })
  profilePicture?: string | null;

  @ApiProperty({
    required: false,
    description: "URL to the user's background or banner image.",
  })
  backgroundPicture?: string | null;

  @ApiProperty({
    required: false,
    example: 'Dhaka',
    description:
      "The seller's business zone (for shipping/location purposes). Only available for sellers.",
  })
  zone?: string;

  @ApiProperty({
    required: false,
    example: 85,
    description:
      'A calculated score representing trustworthiness. Only available for sellers.',
  })
  trustScore?: number;

  @ApiProperty({
    required: false,
    example: true,
    description:
      'Indicates if the user is a trusted member. Only available for sellers.',
  })
  isTrustedUser?: boolean;

  @ApiProperty({
    example: '2025-10-19T02:53:15.478Z',
    description: 'The date the user joined the platform.',
  })
  memberSince: Date;

  static fromUserDocument(
    user: UserDocument,
    profilePictureUrl?: string | null,
    backgroundPictureUrl?: string | null,
  ): UnifiedPublicProfileDto {
    const dto = new UnifiedPublicProfileDto();
    dto._id = user._id.toString();
    dto.profilePicture = profilePictureUrl || null;
    dto.backgroundPicture = backgroundPictureUrl || null;
    dto.memberSince = user.createdAt;
    dto.role = user.role;

    // CASE 1: The user is an approved seller
    if (
      user.role === UserRole.SELLER &&
      user.sellerStatus === SellerStatus.APPROVED
    ) {
      dto.displayName =
        user.businessName || `${user.firstName} ${user.lastName}`;
      dto.contactName = `${user.firstName} ${user.lastName}`.trim();
      dto.email = user.email;
      dto.phone = user.phone;
      dto.address = user.address;
      dto.zone = user.zone;
      dto.trustScore = user.trustScore;
      dto.isTrustedUser = user.isTrustedUser;
    }
    // CASE 2: The user is a customer
    else if (user.role === UserRole.CUSTOMER) {
      const lastNameInitial = user.lastName
        ? `${user.lastName.charAt(0)}.`
        : '';
      dto.displayName = `${user.firstName} ${lastNameInitial}`.trim();
    }
    // CASE 3: The user is an admin
    else if (user.role === UserRole.ADMIN) {
      const lastNameInitial = user.lastName
        ? `${user.lastName.charAt(0)}.`
        : '';
      dto.displayName = `${user.firstName} ${lastNameInitial}`.trim();
    }

    return dto;
  }
}

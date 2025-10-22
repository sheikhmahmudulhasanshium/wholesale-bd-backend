import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../schemas/user.schema';

/**
 * Data Transfer Object for a user's public-facing profile.
 * This DTO exposes only a limited, safe set of user information.
 * It is designed for approved sellers.
 */
export class UserPublicProfileDto {
  @ApiProperty({
    example: '65f1c4a0ef3e2bde5f269a47',
    description: 'The unique identifier of the user.',
  })
  _id: string;

  @ApiProperty({ example: 'John', description: "User's first name." })
  firstName: string;

  @ApiProperty({
    required: false,
    description: "URL to the user's profile picture.",
  })
  profilePicture?: string;

  @ApiProperty({
    required: false,
    example: 'Doe Electronics',
    description: "The user's public business name.",
  })
  businessName?: string;

  @ApiProperty({
    required: false,
    example: 'Specializing in vintage audio equipment.',
    description: 'A public description of the user/business.',
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
    example: '2023-01-15T10:00:00.000Z',
    description: 'The date the user created their account.',
  })
  memberSince: Date;

  /**
   * Creates a UserPublicProfileDto from a UserDocument.
   * @param userDoc The Mongoose document for the user.
   * @returns A new UserPublicProfileDto instance.
   */
  static fromUserDocument(userDoc: UserDocument): UserPublicProfileDto {
    const dto = new UserPublicProfileDto();
    dto._id = userDoc._id.toString();
    dto.firstName = userDoc.firstName;
    dto.profilePicture = userDoc.profilePicture;
    dto.businessName = userDoc.businessName;
    dto.businessDescription = userDoc.businessDescription;
    dto.isTrustedUser = userDoc.isTrustedUser;
    dto.trustScore = userDoc.trustScore;
    dto.reviewCount = userDoc.reviewCount;
    dto.memberSince = userDoc.createdAt;
    return dto;
  }
}

import { UserDocument } from '../schemas/user.schema'; // <-- 1. IMPORT the UserDocument type

// This class defines the shape of the User object we send back to the client.
// Notice it does NOT include the password.
export class UserResponseDto {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  address?: string;
  zone?: string;
  isActive: boolean;
  emailVerified: boolean;
  role: string; // e.g., 'admin', 'seller'
  kycStatus: string;
  sellerStatus: string;
  businessName?: string;
  trustScore: number;
  isTrustedUser: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;

  // This is a helper function to easily convert a database document to a DTO
  // FIXED: We specify the correct type for userDoc instead of `any`
  static fromUserDocument(userDoc: UserDocument): UserResponseDto {
    // <-- 2. SPECIFY the correct type here
    const dto = new UserResponseDto();

    // Now TypeScript knows the exact shape of userDoc, and all these assignments are safe!
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

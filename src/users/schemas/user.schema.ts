import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// --- Enums for Type Safety ---
export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
}

export enum KycStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  NOT_STARTED = 'not_started',
}

export enum SellerStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

// --- Nested Schema for TwoFactorAuth ---
@Schema({ _id: false }) // _id: false prevents Mongoose from creating an _id for this sub-document
class TwoFactorAuth {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ type: [String], default: [] })
  backupCodes: string[];
}
const TwoFactorAuthSchema = SchemaFactory.createForClass(TwoFactorAuth);

// --- Main User Schema ---
@Schema({ timestamps: true })
export class User {
  // --- Core Identity ---
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false }) // `select: false` hides the password by default in `find()` queries
  password?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  profilePicture?: string; // For Google/Social logins

  // --- Authentication & Social Login ---
  @Prop({ type: [String], default: [] })
  authProviders: string[];

  @Prop()
  googleId?: string;

  @Prop()
  firebaseUid?: string;

  // --- Location & Contact ---
  @Prop()
  address?: string;

  @Prop()
  zone?: string;

  // --- Status & Roles ---
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: String, enum: KycStatus, default: KycStatus.NOT_STARTED })
  kycStatus: KycStatus;

  @Prop({ type: String, enum: SellerStatus, default: SellerStatus.PENDING })
  sellerStatus: SellerStatus;

  // --- Seller-Specific Information ---
  @Prop()
  businessName?: string;

  @Prop()
  businessLicense?: string;

  @Prop()
  businessDescription?: string;

  @Prop({ type: Date })
  sellerAppliedAt?: Date;

  @Prop({ type: Date })
  sellerApprovedAt?: Date;

  // --- Trust & Reputation ---
  @Prop({ default: false })
  isTrustedUser: boolean;

  @Prop({ type: Date })
  trustedUserSince?: Date;

  @Prop({ default: 0 })
  trustScore: number;

  // --- Activity & Engagement ---
  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  submissionCount: number;

  @Prop({ default: 0 })
  helpfulVotesReceived: number;

  @Prop({ type: Date })
  lastLogin?: Date;

  // --- User Preferences & Documents ---
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Broker' }],
    default: [],
  })
  favoriteBrokers: string[]; // Assuming these are references to other collections

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PropFirm' }],
    default: [],
  })
  favoritePropFirms: string[]; // Assuming these are references to other collections

  @Prop({ type: [String], default: [] })
  kycDocuments: string[]; // Assuming these are URLs to documents

  // --- Security ---
  @Prop({
    type: TwoFactorAuthSchema,
    default: () => ({ enabled: false, backupCodes: [] }),
  })
  twoFactorAuth: TwoFactorAuth;

  // =======================================================================
  @Prop({ default: false, index: true })
  isSampleData: boolean;
  // --- ADDED FOR TYPESCRIPT AWARENESS ---
  // These are automatically managed by Mongoose via the `timestamps: true` option,
  // but we need to declare them here for TypeScript to know they exist.
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

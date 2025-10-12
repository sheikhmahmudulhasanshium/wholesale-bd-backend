import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
<<<<<<< HEAD
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document<Types.ObjectId>;

@Schema({ _id: false })
class KycDocument {
  @Prop({ required: true, enum: ['id_front', 'id_back', 'selfie'] })
  type: string;
  @Prop({ required: true })
  url: string;
  @Prop({ default: Date.now })
  uploadedAt: Date;
  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;
  @Prop()
  rejectionReason?: string;
}

@Schema({ _id: false })
class TwoFactorAuth {
  @Prop({ default: false })
  enabled: boolean;
  @Prop()
  secret?: string;
  @Prop({ type: [String], default: [] })
  backupCodes: string[];
  @Prop()
  enabledAt?: Date;
}

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ type: String, ref: 'Zone' })
  zone?: string;

  @Prop({
    type: [String],
    enum: ['google', 'facebook', 'linkedin', 'email'],
    default: [],
  })
  authProviders: string[];

  @Prop()
  firebaseUid?: string;

=======
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
>>>>>>> main
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

<<<<<<< HEAD
  @Prop()
  lastLogin?: Date;

  @Prop()
  resetPasswordOtp?: string;

  @Prop()
  resetPasswordOtpExpires?: Date;

  @Prop()
  emailVerificationOtp?: string;

  @Prop()
  emailVerificationOtpExpires?: Date;

  @Prop({ enum: ['customer', 'seller', 'admin'], default: 'customer' })
  role: string;

  @Prop({
    enum: ['not_started', 'pending', 'approved', 'rejected'],
    default: 'not_started',
  })
  kycStatus: string;

  @Prop({ type: [KycDocument], default: [] })
  kycDocuments: KycDocument[];

  @Prop()
  kycSubmittedAt?: Date;

  @Prop({ default: false })
  isTrustedUser: boolean;

  @Prop()
=======
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
>>>>>>> main
  trustedUserSince?: Date;

  @Prop({ default: 0 })
  trustScore: number;

<<<<<<< HEAD
  @Prop({
    type: TwoFactorAuth,
=======
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
>>>>>>> main
    default: () => ({ enabled: false, backupCodes: [] }),
  })
  twoFactorAuth: TwoFactorAuth;

<<<<<<< HEAD
  // Seller-specific fields
  @Prop({ enum: ['pending', 'approved', 'rejected'] })
  sellerStatus?: string;
  @Prop()
  businessName?: string;
  @Prop()
  businessLicense?: string;
  @Prop()
  businessDescription?: string;
  @Prop()
  sellerAppliedAt?: Date;
  @Prop()
  sellerApprovedAt?: Date;
  @Prop()
  sellerRejectionReason?: string;
}

// ... (imports and class definition are the same) ...
export const UserSchema = SchemaFactory.createForClass(User);

// REMOVE: UserSchema.index({ email: 1 }); // This is handled by `unique: true` in @Prop
UserSchema.index({ role: 1 });
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ isTrustedUser: 1 });
UserSchema.index({ trustScore: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });
=======
  // =======================================================================
  // --- ADDED FOR TYPESCRIPT AWARENESS ---
  // These are automatically managed by Mongoose via the `timestamps: true` option,
  // but we need to declare them here for TypeScript to know they exist.
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
>>>>>>> main

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

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
  trustedUserSince?: Date;

  @Prop({ default: 0 })
  trustScore: number;

  @Prop({
    type: TwoFactorAuth,
    default: () => ({ enabled: false, backupCodes: [] }),
  })
  twoFactorAuth: TwoFactorAuth;

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

// src/user-activity/dto/track-activity.dto.ts
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export enum ActivityType {
  VIEW_PRODUCT = 'view_product',
  SEARCH = 'search',
  // Future actions can be added here, e.g., LIKE_CATEGORY
}

export class TrackActivityDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string | Types.ObjectId;

  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;
}

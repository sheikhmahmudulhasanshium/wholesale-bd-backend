// src/uploads/dto/upload.dto.ts

import { IsString, IsNotEmpty, Matches, IsUrl, IsEnum } from 'class-validator';
import { AssetCategory } from '../enums/asset-category.enum';

// For the text field in multipart/form-data
export class UploadFileBodyDto {
  @IsEnum(AssetCategory)
  category: AssetCategory;
}

// For Base64 uploads
export class UploadBase64Dto {
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^data:(image|application|video|audio)\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/]+={0,2}$/,
    {
      message: 'data must be a valid Base64 data URL string.',
    },
  )
  data: string;
}

// For URL uploads
export class UploadUrlDto {
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @IsUrl()
  @IsNotEmpty()
  url: string;
}

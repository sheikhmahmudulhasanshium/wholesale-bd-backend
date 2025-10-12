// src/uploads/dto/upload.dto.ts

import { IsString, IsNotEmpty, Matches, IsUrl, IsEnum } from 'class-validator';
import { AssetCategory } from '../enums/asset-category.enum';
import { ApiProperty } from '@nestjs/swagger'; // <-- IMPORT THIS

// For the text field in multipart/form-data
export class UploadFileBodyDto {
  @ApiProperty({
    // <-- ADD THIS
    enum: AssetCategory,
    description: 'The category of the asset being uploaded.',
    example: AssetCategory.Photo,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;
}

// For Base64 uploads
export class UploadBase64Dto {
  @ApiProperty({
    // <-- ADD THIS
    enum: AssetCategory,
    description: 'The category of the asset being uploaded.',
    example: AssetCategory.Photo,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({
    // <-- ADD THIS
    description: 'A valid Base64 data URL string.',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  })
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
  @ApiProperty({
    // <-- ADD THIS
    enum: AssetCategory,
    description: 'The category of the asset being uploaded.',
    example: AssetCategory.Document,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({
    // <-- ADD THIS
    description: 'A public URL pointing to the file to be uploaded.',
    example:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

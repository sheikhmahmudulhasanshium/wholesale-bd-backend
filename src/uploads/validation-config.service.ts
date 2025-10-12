// src/uploads/validation-config.service.ts

import { Injectable } from '@nestjs/common';
import { AssetCategory } from './enums/asset-category.enum';

interface ValidationConfig {
  maxSize: number; // in bytes
  fileType: RegExp;
}

@Injectable()
export class ValidationConfigService {
  private readonly configs: Record<AssetCategory, ValidationConfig> = {
    [AssetCategory.Photo]: {
      maxSize: 10 * 1024 * 1024, // 10MB
      fileType: /image\/(jpeg|png|gif|svg\+xml|webp)/,
    },
    [AssetCategory.Video]: {
      maxSize: 100 * 1024 * 1024, // 100MB
      fileType: /video\/(mp4|webm|ogg|quicktime|mov)/,
    },
    [AssetCategory.Sound]: {
      maxSize: 20 * 1024 * 1024, // 20MB
      fileType: /audio\/(mpeg|wav|ogg|mp3)/,
    },
    [AssetCategory.Document]: {
      maxSize: 15 * 1024 * 1024, // 15MB
      fileType:
        /application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/,
    },
    [AssetCategory.Other]: {
      maxSize: 50 * 1024 * 1024, // 50MB
      fileType: /.*/, // Allow any file type
    },
  };

  getConfig(category: AssetCategory): ValidationConfig {
    return this.configs[category];
  }
}

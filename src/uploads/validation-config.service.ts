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
      // --- THIS IS THE FINAL FIX ---
      // We are no longer trying to list every specific subtype.
      // This regex simply checks if the MIME type starts with "image/".
      // It is simpler and avoids the character parsing bug entirely.
      fileType: /^image\//,
    },
    [AssetCategory.Video]: {
      maxSize: 100 * 1024 * 1024, // 100MB
      // Applying the same robust pattern here for consistency
      fileType: /^video\//,
    },
    [AssetCategory.Sound]: {
      maxSize: 20 * 1024 * 1024, // 20MB
      // Applying the same robust pattern here for consistency
      fileType: /^audio\//,
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

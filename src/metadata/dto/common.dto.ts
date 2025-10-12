// src/metadata/dto/common.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

// A flexible object for multi-language strings
export class I18nStringDto {
  [key: string]: string;
}

// Represents a file asset (image, logo, etc.)
// The 'url' would come from our upload system
export class AssetDto {
  @IsString() @IsNotEmpty() name: string;
  @IsUrl() @IsNotEmpty() url: string;
  @IsString() @IsNotEmpty() type: string;
  @IsNumber() width: number;
  @IsNumber() height: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nStringDto)
  alt?: I18nStringDto;
}

// Represents a hyperlink in navigation
export class LinkDto {
  @ValidateNested() @Type(() => I18nStringDto) label: I18nStringDto;
  @IsUrl() @IsNotEmpty() url: string;
  @IsString() @IsOptional() icon?: string;
}

// Represents a special button, extending a link
export class CustomButtonDto extends LinkDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsOptional() variant?: string;
}

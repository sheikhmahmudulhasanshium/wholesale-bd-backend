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
import { ApiProperty } from '@nestjs/swagger'; // <-- IMPORT THIS

export class I18nStringDto {
  [key: string]: string;
}

export class AssetDto {
  @ApiProperty({ example: 'Brand Logo Dark' }) // <-- ADD ALL ApiProperty
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://cdn.example.com/logo-dark.svg' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'image/svg+xml' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 630 })
  @IsNumber()
  height: number;

  @ApiProperty({
    type: I18nStringDto,
    required: false,
    example: { 'en-US': 'The dark version of the brand logo.' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nStringDto)
  alt?: I18nStringDto;
}

export class LinkDto {
  @ApiProperty({ type: I18nStringDto, example: { 'en-US': 'About Us' } })
  @ValidateNested()
  @Type(() => I18nStringDto)
  label: I18nStringDto;

  @ApiProperty({ example: '/about' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ required: false, example: 'mdi-information' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class CustomButtonDto extends LinkDto {
  @ApiProperty({ example: 'cta-header' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ required: false, example: 'primary' })
  @IsString()
  @IsOptional()
  variant?: string;
}

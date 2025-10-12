// src/metadata/dto/update-brand.dto.ts

import {
  IsEnum,
  ValidateNested,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetDto, I18nStringDto } from './common.dto';
import { ApiProperty } from '@nestjs/swagger'; // <-- IMPORT THIS

export class UpdateBrandDto {
  @ApiProperty({ enum: ['configured', 'pending'], example: 'configured' }) // <-- ADD ALL ApiProperty
  @IsEnum(['configured', 'pending'])
  status: 'configured' | 'pending';

  @ApiProperty({ required: false, example: 'Wholesale BD' })
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiProperty({
    type: I18nStringDto,
    required: false,
    example: { 'en-US': 'Your B2B Partner' },
  })
  @ValidateNested()
  @Type(() => I18nStringDto)
  @IsOptional()
  brandSlogan?: I18nStringDto;

  @ApiProperty({ type: [AssetDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  brandSymbol?: AssetDto[];

  @ApiProperty({ type: [AssetDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  brandLogo?: AssetDto[];

  @ApiProperty({ type: [AssetDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  favicon?: AssetDto[];
}

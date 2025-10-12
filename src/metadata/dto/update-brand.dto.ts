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

export class UpdateBrandDto {
  @IsEnum(['configured', 'pending']) status: 'configured' | 'pending';
  @IsString() @IsOptional() brandName?: string;
  @ValidateNested()
  @Type(() => I18nStringDto)
  @IsOptional()
  brandSlogan?: I18nStringDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  brandSymbol?: AssetDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  brandLogo?: AssetDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  @IsOptional()
  favicon?: AssetDto[];
}

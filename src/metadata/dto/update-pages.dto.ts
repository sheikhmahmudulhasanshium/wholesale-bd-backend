// src/metadata/dto/update-pages.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { I18nStringDto, LinkDto, CustomButtonDto } from './common.dto';

class PageNavigationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  headerLinks?: LinkDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  footerLinks?: LinkDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  sidebarLinks?: LinkDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomButtonDto)
  @IsOptional()
  customButtons?: CustomButtonDto[];
}

class PageMetaDto {
  @ValidateNested() @Type(() => I18nStringDto) title: I18nStringDto;
  @ValidateNested() @Type(() => I18nStringDto) description: I18nStringDto;
  // In a real app, you could add more OpenGraph fields here
}

export class PageItemDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() path: string;
  @IsEnum(['public', 'protected', 'private', 'admin']) accessType:
    | 'public'
    | 'protected'
    | 'private'
    | 'admin';
  @ValidateNested() @Type(() => PageMetaDto) meta: PageMetaDto;
  @ValidateNested()
  @Type(() => PageNavigationDto)
  navigation: PageNavigationDto;
}

export class UpdatePagesDto {
  @IsEnum(['configured', 'pending']) status: 'configured' | 'pending';
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageItemDto)
  items: PageItemDto[];
}

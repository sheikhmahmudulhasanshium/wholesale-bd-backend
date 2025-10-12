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
import { ApiProperty } from '@nestjs/swagger'; // <-- IMPORT THIS

class PageNavigationDto {
  @ApiProperty({ type: [LinkDto], required: false }) // <-- ADD ALL ApiProperty
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  headerLinks?: LinkDto[];

  @ApiProperty({ type: [LinkDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  footerLinks?: LinkDto[];

  @ApiProperty({ type: [LinkDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  sidebarLinks?: LinkDto[];

  @ApiProperty({ type: [CustomButtonDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomButtonDto)
  @IsOptional()
  customButtons?: CustomButtonDto[];
}

class PageMetaDto {
  @ApiProperty({ type: I18nStringDto, example: { 'en-US': 'Home Page' } })
  @ValidateNested()
  @Type(() => I18nStringDto)
  title: I18nStringDto;

  @ApiProperty({
    type: I18nStringDto,
    example: { 'en-US': 'Welcome to our platform.' },
  })
  @ValidateNested()
  @Type(() => I18nStringDto)
  description: I18nStringDto;
}

export class PageItemDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '/' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    enum: ['public', 'protected', 'private', 'admin'],
    example: 'public',
  })
  @IsEnum(['public', 'protected', 'private', 'admin'])
  accessType: 'public' | 'protected' | 'private' | 'admin';

  @ApiProperty()
  @ValidateNested()
  @Type(() => PageMetaDto)
  meta: PageMetaDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PageNavigationDto)
  navigation: PageNavigationDto;
}

export class UpdatePagesDto {
  @ApiProperty({ enum: ['configured', 'pending'], example: 'configured' })
  @IsEnum(['configured', 'pending'])
  status: 'configured' | 'pending';

  @ApiProperty({ type: [PageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageItemDto)
  items: PageItemDto[];
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EntityType } from '../schemas/media.schema';

export class FindMediaDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page.',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Search term to filter by original file name (case-insensitive).',
    example: 'samsung',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter media by the entity it is associated with.',
    enum: EntityType,
    example: EntityType.PRODUCT,
  })
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by MIME type to find specific kinds of files.',
    example: 'image/jpeg',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

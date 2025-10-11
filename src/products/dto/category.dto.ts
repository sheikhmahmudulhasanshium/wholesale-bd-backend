import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  readonly name: string;

  @ApiPropertyOptional({ description: 'A brief description of the category' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'URL for an representative image of the category',
  })
  @IsOptional()
  @IsString()
  readonly imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Order for sorting, lower numbers appear first',
  })
  @IsOptional()
  @IsNumber()
  readonly sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'The name of the category' })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiPropertyOptional({ description: 'A brief description of the category' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'URL for an representative image of the category',
  })
  @IsOptional()
  @IsString()
  readonly imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Order for sorting, lower numbers appear first',
  })
  @IsOptional()
  @IsNumber()
  readonly sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Set the category to active or inactive',
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}

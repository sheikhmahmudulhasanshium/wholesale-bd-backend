import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ description: 'The name of the zone (e.g., Dhaka)' })
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'A short code for the zone (e.g., DHA)' })
  @IsString()
  readonly code: string;

  @ApiPropertyOptional({ description: 'A brief description of the zone' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Order for sorting, lower numbers appear first',
  })
  @IsOptional()
  @IsNumber()
  readonly sortOrder?: number;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ description: 'The name of the zone (e.g., Dhaka)' })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiPropertyOptional({ description: 'A short code for the zone (e.g., DHA)' })
  @IsOptional()
  @IsString()
  readonly code?: string;

  @ApiPropertyOptional({ description: 'A brief description of the zone' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Order for sorting, lower numbers appear first',
  })
  @IsOptional()
  @IsNumber()
  readonly sortOrder?: number;

  @ApiPropertyOptional({ description: 'Set the zone to active or inactive' })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}

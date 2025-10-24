// create-collection.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  IsNumber,
} from 'class-validator';
import { CollectionProductDto } from './collection-product.dto';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Limited Time Offer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'লিমিটেড টাইম অফার' })
  @IsString()
  @IsNotEmpty()
  title_bn: string;

  @ApiProperty({ required: false, example: "Hurry, these deals won't last!" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
    example: 'তাড়াতাড়ি করুন, এই ডিলগুলি স্থায়ী হবে না!',
  })
  @IsString()
  @IsOptional()
  description_bn?: string;

  @ApiProperty({ example: 'limited-time-offer' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ required: false, example: 'Timer' })
  @IsString()
  @IsOptional()
  lucide_react_icon?: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  priority: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, example: '2024-10-20T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  start_date?: Date;

  @ApiProperty({ required: false, example: '2024-10-25T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  end_date?: Date;

  @ApiProperty({ type: [CollectionProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionProductDto)
  products: CollectionProductDto[];
}

// update-collection.dto.ts
export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}

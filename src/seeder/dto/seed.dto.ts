import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export enum SeedEntity {
  USERS = 'users',
  ZONES = 'zones',
  CATEGORIES = 'categories',
  PRODUCTS = 'products',
  ORDERS = 'orders',
}

export class SeedDto {
  @ApiProperty({
    enum: SeedEntity,
    description: 'The type of entity to seed into the database.',
    example: SeedEntity.PRODUCTS,
  })
  @IsEnum(SeedEntity)
  entity: SeedEntity;

  @ApiProperty({
    description: 'The number of documents to create.',
    example: 50,
    minimum: 1,
    maximum: 1000, // Safety limit
  })
  @IsInt()
  @Min(1)
  @Max(1000) // A reasonable safety limit to prevent abuse or mistakes
  quantity: number;
}

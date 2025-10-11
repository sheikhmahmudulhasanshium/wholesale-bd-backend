import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SeedEntity } from './seed.dto'; // Reuse the enum from our SeedDto

export class CleanDto {
  @ApiProperty({
    enum: SeedEntity,
    description: 'The type of sample entity to delete from the database.',
    example: SeedEntity.PRODUCTS,
  })
  @IsEnum(SeedEntity)
  entity: SeedEntity;
}

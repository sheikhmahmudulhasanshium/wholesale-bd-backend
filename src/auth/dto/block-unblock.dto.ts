import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    example: 'Violated terms of service.',
    description: 'Reason for blocking the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

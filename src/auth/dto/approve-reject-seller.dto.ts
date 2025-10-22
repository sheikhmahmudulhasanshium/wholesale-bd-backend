import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectSellerDto {
  @ApiProperty({
    example: 'Business license invalid.',
    description: 'Reason for rejecting seller application',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

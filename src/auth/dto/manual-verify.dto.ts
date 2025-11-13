// src/auth/dto/manual-verify.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ManualVerifyDto {
  @ApiProperty({
    example: 'user1@example.com',
    description: 'The email address of the user to manually verify.',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;
}

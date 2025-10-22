import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current user password',
  })
  @IsString({ message: 'Old password must be a string.' })
  @IsNotEmpty({ message: 'Old password is required.' })
  oldPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password (min 8 characters)',
  })
  @IsString({ message: 'New password must be a string.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @IsNotEmpty({ message: 'New password is required.' })
  newPassword: string;
}

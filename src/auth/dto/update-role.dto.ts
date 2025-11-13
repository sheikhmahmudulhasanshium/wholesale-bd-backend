// src/auth/dto/update-role.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from 'src/users/schemas/user.schema';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'The new role to assign to the user.',
    enum: UserRole,
    example: UserRole.SELLER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role } from 'src/auth/enums/role.enum';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class AdminUpdateUserDto extends UpdateProfileDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsString()
  sellerStatus?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

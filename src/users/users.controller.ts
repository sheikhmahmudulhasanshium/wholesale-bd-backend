import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  AdminUpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.getProfile(user._id);
  }

  @Put('profile')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user._id, updateDto);
  }

  // --- Admin Routes ---

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 200, description: 'Get all users with pagination' })
  getAllUsers(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('admin/sellers/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 200, description: 'Get pending seller applications' })
  getPendingSellers(@Query() query: UserQueryDto) {
    const sellerQuery: UserQueryDto = {
      ...query,
      sellerStatus: 'pending',
      role: Role.SELLER,
    };
    return this.usersService.findAll(sellerQuery);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getUserById(@Param('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminUpdateUser(
    @Param('id') userId: string,
    @Body() updateDto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(userId, updateDto);
  }

  @Patch('admin/sellers/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approveSeller(@Param('id') sellerId: string) {
    return this.usersService.approveSeller(sellerId);
  }

  @Patch('admin/sellers/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  rejectSeller(@Param('id') sellerId: string, @Body('reason') reason: string) {
    return this.usersService.rejectSeller(sellerId, reason);
  }

  @Patch('admin/:id/block')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  blockUser(@Param('id') userId: string) {
    return this.usersService.blockUser(userId);
  }

  @Patch('admin/:id/unblock')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  unblockUser(@Param('id') userId: string) {
    return this.usersService.unblockUser(userId);
  }
}

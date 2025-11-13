// src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
  Put, // --- V NEW ---
  Delete, // --- V NEW ---
  HttpCode, // --- V NEW ---
  HttpStatus, // --- V NEW ---
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserDocument, SellerStatus } from './schemas/user.schema';
import { Public } from '../auth/decorators/public.decorator';
import { UnifiedPublicProfileDto } from './dto/unified-public-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Media, MediaDocument } from 'src/storage/schemas/media.schema';
import { GroupedMedia } from 'src/uploads/uploads.service';
import { MediaPurpose } from 'src/uploads/enums/media-purpose.enum';
import { SetProfilePictureFromUrlDto } from './dto/set-profile-picture-from-url.dto';
import { UpdateRoleDto } from '../auth/dto/update-role.dto'; // --- V NEW ---

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  // --- V ALL NEW ADMIN ENDPOINTS ---

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get a list of all users' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async adminFindAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listUsers();
    return users.map((user) => this.usersService.toUserResponseDto(user));
  }

  @Get('admin/unverified')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all users with unverified emails' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findUnverifiedUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listUsers({ emailVerified: false });
    return users.map((user) => this.usersService.toUserResponseDto(user));
  }

  @Get('admin/inactive')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all inactive (blocked) users' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findInactiveUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listUsers({ isActive: false });
    return users.map((user) => this.usersService.toUserResponseDto(user));
  }

  @Get('admin/pending-sellers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all sellers with pending applications' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findPendingSellers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listUsers({
      role: UserRole.SELLER,
      sellerStatus: SellerStatus.PENDING,
    });
    return users.map((user) => this.usersService.toUserResponseDto(user));
  }

  @Put('admin/:id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Admin: Manually verify a user's email" })
  @ApiOkResponse({ type: UserResponseDto })
  async manualVerify(@Param('id') userId: string): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.manualVerify(userId);
    return this.usersService.toUserResponseDto(updatedUser);
  }

  @Put('admin/:id/change-role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Admin: Change a user's role" })
  @ApiOkResponse({ type: UserResponseDto })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateRole(
      userId,
      updateRoleDto.role,
    );
    return this.usersService.toUserResponseDto(updatedUser);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Permanently delete a user' })
  @ApiOkResponse({ description: 'User deleted successfully.' })
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<void> {
    await this.usersService.delete(userId, adminUser);
  }

  // --- ^ END OF NEW ADMIN ENDPOINTS ---

  @Post('me/profile-picture/from-url')
  @ApiOperation({
    summary: "Set the current user's profile picture from an external URL",
  })
  @ApiOkResponse({
    description: 'Profile picture set successfully.',
    type: Media,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async setProfilePictureFromUrl(
    @CurrentUser() user: UserDocument,
    @Body() dto: SetProfilePictureFromUrlDto,
  ): Promise<MediaDocument> {
    return this.usersService.setProfileOrBannerPictureFromUrl(
      user,
      dto,
      MediaPurpose.PROFILE_PICTURE,
    );
  }

  @Post('me/background-picture/from-url')
  @ApiOperation({
    summary: "Set the current user's background picture from an external URL",
  })
  @ApiOkResponse({
    description: 'Background picture set successfully.',
    type: Media,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async setBackgroundPictureFromUrl(
    @CurrentUser() user: UserDocument,
    @Body() dto: SetProfilePictureFromUrlDto,
  ): Promise<MediaDocument> {
    return this.usersService.setProfileOrBannerPictureFromUrl(
      user,
      dto,
      MediaPurpose.PROFILE_BANNER,
    );
  }

  @Post('me/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: "Upload or update the current user's profile picture",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file for the profile picture',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    description: 'Profile picture updated successfully.',
    type: Media,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async uploadProfilePicture(
    @CurrentUser() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MediaDocument> {
    return this.usersService.setProfileOrBannerPicture(
      user,
      file,
      MediaPurpose.PROFILE_PICTURE,
    );
  }

  @Post('me/background-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: "Upload or update the current user's background/banner picture",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file for the background picture',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    description: 'Background picture updated successfully.',
    type: Media,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async uploadBackgroundPicture(
    @CurrentUser() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MediaDocument> {
    return this.usersService.setProfileOrBannerPicture(
      user,
      file,
      MediaPurpose.PROFILE_BANNER,
    );
  }

  @Get('me/uploads')
  @ApiOperation({ summary: 'Get all media uploaded by the current user' })
  @ApiOkResponse({ description: "Returns a grouped list of the user's media." })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async getMyUploads(@CurrentUser() user: UserDocument): Promise<GroupedMedia> {
    return this.usersService.getMyUploads(user._id.toString());
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({
    description: 'Returns the full profile of the logged-in user.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  getProfile(@CurrentUser() user: UserDocument): UserResponseDto {
    return this.usersService.toUserResponseDto(user);
  }

  @Public()
  @Get('count')
  @ApiOperation({
    summary: 'Get the total number of registered users (Public)',
  })
  @ApiOkResponse({
    description: 'Returns the total count of users.',
    schema: { example: { totalUsers: 125 } },
  })
  async getUserCount(): Promise<{ totalUsers: number }> {
    const count = await this.usersService.countAll();
    return { totalUsers: count };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a unified public user profile by ID (Public)' })
  @ApiOkResponse({
    description:
      'Returns a public profile. The content varies by user role (seller vs. customer). Admin and other private profiles will not be found.',
    type: UnifiedPublicProfileDto,
  })
  @ApiNotFoundResponse({
    description: 'Public profile not found or is private.',
  })
  async getUnifiedPublicProfile(
    @Param('id') id: string,
  ): Promise<UnifiedPublicProfileDto> {
    const userProfile =
      await this.usersService.findUnifiedPublicProfileById(id);
    if (!userProfile) {
      throw new NotFoundException('Public profile not found or is private.');
    }
    return userProfile;
  }
}

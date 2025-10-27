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
import { UserRole, UserDocument } from './schemas/user.schema';
import { Public } from '../auth/decorators/public.decorator';
import { UnifiedPublicProfileDto } from './dto/unified-public-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Media, MediaDocument } from 'src/storage/schemas/media.schema';
import { GroupedMedia } from 'src/uploads/uploads.service';
import { MediaPurpose } from 'src/uploads/enums/media-purpose.enum';
import { SetProfilePictureFromUrlDto } from './dto/set-profile-picture-from-url.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

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
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5 MB
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
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10 MB
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

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a list of all users (Requires Admin Role)' })
  @ApiOkResponse({
    description: 'An array of user records.',
    type: [UserResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized or insufficient permissions.',
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => UserResponseDto.fromUserDocument(user));
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

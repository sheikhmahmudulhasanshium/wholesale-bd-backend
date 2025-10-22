import {
  Controller,
  Get,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { UserPublicProfileDto } from './dto/user-public-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  // --- vvvvvvv LINTER ERROR FIXED HERE vvvvvvv ---
  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({
    description: 'Returns the full profile of the logged-in user.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  // REMOVED `async` and `Promise<>` because the method is now synchronous
  getProfile(@CurrentUser() user: UserDocument): UserResponseDto {
    // This is now a simple synchronous operation
    return this.usersService.toUserResponseDto(user);
  }
  // --- ^^^^^^^ LINTER ERROR FIXED HERE ^^^^^^^ ---

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
  @ApiOperation({
    summary: 'Get a public user profile by ID (for approved sellers only)',
  })
  @ApiOkResponse({
    description:
      'Returns a limited, public view of an approved seller profile.',
    type: UserPublicProfileDto,
  })
  @ApiNotFoundResponse({
    description:
      'Public profile not found or user is not an active, approved seller.',
  })
  async getPublicProfile(
    @Param('id') id: string,
  ): Promise<UserPublicProfileDto> {
    const user = await this.usersService.findPublicProfileById(id);
    if (!user) {
      throw new NotFoundException(
        'Public profile not found or user is not an active, approved seller.',
      );
    }
    return UserPublicProfileDto.fromUserDocument(user);
  }
}

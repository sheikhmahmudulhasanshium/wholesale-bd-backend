// src/user-activity/user-activity.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserActivityService } from './user-activity.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDocument } from 'src/users/schemas/user.schema';
import { DiscoveryResponseDto } from './dto/discovery-response.dto';

@ApiTags('User Activity & Discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Get('me/discover')
  @ApiOperation({
    summary: 'Get a personalized discovery feed for the current user',
    description:
      'Returns sections like "Recently Viewed" and "Recommended for You" based on user activity. Provides a generic "Trending" feed for new users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Discovery feed returned successfully.',
    type: DiscoveryResponseDto,
  })
  async getMyDiscoveryFeed(
    @CurrentUser() user: UserDocument,
  ): Promise<DiscoveryResponseDto> {
    return this.userActivityService.getDiscoveryFeed(user);
  }
}

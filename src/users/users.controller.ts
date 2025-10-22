// src/users/users.controller.ts (This file is correct)

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { UserService } from './users.service';
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of registered users' })
  @ApiOkResponse({
    description: 'Returns the total count of users.',
    schema: { example: { totalUsers: 125 } },
  })
  async getUserCount(): Promise<{ totalUsers: number }> {
    const count = await this.usersService.countAll();
    return { totalUsers: count };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all users (Protected)' })
  @ApiOkResponse({
    description: 'An array of user records.',
    type: [UserResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'The secret API key for access',
    required: true,
  })
  @UseGuards(ApiKeyGuard)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    // This line will now work correctly because `users` is correctly inferred as `UserDocument[]`
    return users.map((user) => UserResponseDto.fromUserDocument(user));
  }
}

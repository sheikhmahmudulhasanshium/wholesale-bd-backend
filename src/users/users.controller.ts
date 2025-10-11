import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@ApiTags('Users')
@Controller('users')
// NOTE: We have removed @UseGuards and @ApiHeader from the controller level
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- NEW PUBLIC ENDPOINT ---
  @Get('count')
  @ApiOperation({ summary: 'Get the total number of registered users' })
  async getUserCount(): Promise<{ totalUsers: number }> {
    const count = await this.usersService.countAll();
    return { totalUsers: count };
  }

  // --- EXISTING PRIVATE ENDPOINT ---
  @Get()
  @ApiOperation({ summary: 'Get a list of all users (Protected)' })
  // We moved the guard and header here to protect only this specific endpoint
  @ApiHeader({
    name: 'x-api-key',
    description: 'The secret API key for access',
  })
  @UseGuards(ApiKeyGuard)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => UserResponseDto.fromUserDocument(user));
  }
}

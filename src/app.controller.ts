// src/app.controller.ts

import {
  Controller,
  Get,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { AppService, HealthStatus, DbStats } from './app.service';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBearerAuth, // --- ADDED: For Swagger JWT documentation ---
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // --- ADDED: New JWT Guard ---
import { RolesGuard } from './auth/guards/roles.guard'; // --- ADDED: New Roles Guard ---
import { Roles } from './auth/decorators/roles.decorator'; // --- ADDED: Roles decorator ---
import { UserRole } from './users/schemas/user.schema'; // --- ADDED: UserRole enum ---

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Default welcome endpoint for the API' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get the health status of the API and Database' })
  @ApiResponse({ status: 200, description: 'API and database are healthy.' })
  @ApiResponse({
    status: 503,
    description: 'Service is unavailable (e.g., database is down).',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getStatus(): HealthStatus {
    const healthStatus = this.appService.getStatus();

    if (healthStatus.dbStatus !== 'connected') {
      throw new ServiceUnavailableException(healthStatus);
    }

    return healthStatus;
  }

  @Get('db-stats')
  @ApiOperation({
    summary: 'Get DB stats (Protected - Requires Admin Role)',
  })
  @ApiOkResponse({
    description: 'Returns a map of collection names to document counts.',
    schema: { example: { categories: 15, users: 125 } },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized or insufficient permissions.',
  })
  @ApiBearerAuth() // --- CHANGED: Use Bearer Auth for JWT ---
  @UseGuards(JwtAuthGuard, RolesGuard) // --- CHANGED: Apply JWT and Roles guards ---
  @Roles(UserRole.ADMIN) // --- ADDED: Only Admins can access this endpoint ---
  async getDbStats(): Promise<DbStats> {
    return this.appService.getDbStats();
  }
}

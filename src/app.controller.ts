// src/app.controller.ts

import {
  Controller,
  Get,
  ServiceUnavailableException,
  UseGuards, // +++ ADD THIS +++
} from '@nestjs/common';
import { AppService, HealthStatus, DbStats } from './app.service'; // +++ UPDATE THIS +++
import {
  ApiHeader, // +++ ADD THIS +++
  ApiOkResponse, // +++ ADD THIS +++
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse, // +++ ADD THIS +++
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from './auth/guards/api-key.guard'; // +++ ADD THIS +++

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

  // +++ ADD THIS NEW ENDPOINT +++
  @Get('db-stats')
  @ApiOperation({
    summary: 'Get document counts for all database collections (Protected)',
  })
  @ApiOkResponse({
    description: 'Returns a map of collection names to document counts.',
    schema: {
      example: {
        categories: 15,
        orders: 1500,
        products: 542,
        users: 125,
        zones: 8,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API Key.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'The secret API key for access',
    required: true,
  })
  @UseGuards(ApiKeyGuard)
  async getDbStats(): Promise<DbStats> {
    return this.appService.getDbStats();
  }
}

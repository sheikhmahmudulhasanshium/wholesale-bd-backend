// src/app.controller.ts

import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService, HealthStatus } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

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
  // FIXED: Removed 'async' and 'Promise' to match the service method
  getStatus(): HealthStatus {
    // FIXED: Removed 'await'
    const healthStatus = this.appService.getStatus();

    if (healthStatus.dbStatus !== 'connected') {
      throw new ServiceUnavailableException(healthStatus);
    }

    return healthStatus;
  }
}

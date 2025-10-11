import {
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppService, HealthStatus } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { SeedService } from './common/seeds/seed.service';

@ApiTags('Health & Seeding')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly seedService: SeedService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Default welcome endpoint for the API' })
  @SkipThrottle()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get the health status of the API and Database' })
  @ApiResponse({ status: 200, description: 'API and database are healthy.' })
  @ApiResponse({ status: 503, description: 'Service is unavailable.' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getStatus(): HealthStatus {
    const healthStatus = this.appService.getStatus();
    if (healthStatus.dbStatus !== 'connected') {
      throw new ServiceUnavailableException(healthStatus);
    }
    return healthStatus;
  }

  @Post('seed')
  @ApiOperation({ summary: 'Run database seeder (for development)' })
  @ApiResponse({ status: 201, description: 'Database seeded successfully.' })
  @SkipThrottle()
  async runSeeds() {
    await this.seedService.runAllSeeds();
    return { message: 'Database seeded successfully' };
  }

  @Get('seed/verify')
  @ApiOperation({ summary: 'Verify seeded data counts (for development)' })
  @ApiResponse({ status: 200, description: 'Seeded data counts retrieved.' })
  @SkipThrottle()
  async verifySeedData() {
    const stats = await this.seedService.getSeededDataStats();
    return { message: 'Seeded data counts', stats };
  }
}

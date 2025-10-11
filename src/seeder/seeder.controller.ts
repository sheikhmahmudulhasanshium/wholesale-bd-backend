import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CleanDto } from './dto/clean.dto';
import { SeedDto } from './dto/seed.dto';
import { SeederService } from './seeder.service';

@ApiTags('!! Seeder (Admin Only) !!')
@Controller('seeder')
@UseGuards(ApiKeyGuard)
export class SeederController {
  constructor(
    private readonly seederService: SeederService,
    private readonly configService: ConfigService,
  ) {}

  // --- NEW, DEDICATED ADMIN SETUP ENDPOINT ---
  @Post('setup-initial-admin')
  @ApiOperation({
    summary: 'Create a default admin user if none exist.',
    description: `This is a safe, idempotent endpoint. It checks if any admin user already exists. If not, it creates one with default credentials (admin@wholesalebd.com / Admin@1234). If an admin already exists, it does nothing. THIS ENDPOINT IS DISABLED IN PRODUCTION.`,
  })
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'The secret API key for access.',
  })
  @ApiResponse({ status: 201, description: 'Default admin user was created.' })
  @ApiResponse({
    status: 200,
    description: 'An admin user already exists, no action was taken.',
  })
  async setupInitialAdmin() {
    this.checkProduction();
    const message = await this.seederService.setupInitialAdmin();
    return { message };
  }

  @Post('run')
  @ApiOperation({
    summary: 'Add a specified quantity of sample data (Sellers/Customers).',
    description: `This endpoint adds new sample data marked with 'isSampleData: true'. It will NEVER create admin users. It can be run at any time. THIS ENDPOINT IS DISABLED IN PRODUCTION.`,
  })
  @ApiBody({ type: SeedDto })
  // ... other decorators are the same
  async seed(@Body() seedDto: SeedDto) {
    this.checkProduction();
    const message = await this.seederService.seed(seedDto);
    return { message };
  }

  @Delete('clean')
  @ApiOperation({
    summary: 'Delete all sample data for a specific entity.',
    description: `This endpoint permanently deletes all documents where 'isSampleData: true' for the specified entity. This action is irreversible. THIS ENDPOINT IS DISABLED IN PRODUCTION.`,
  })
  @ApiBody({ type: CleanDto })
  // ... other decorators are the same
  async clean(@Body() cleanDto: CleanDto) {
    this.checkProduction();
    const result = await this.seederService.clean(cleanDto);
    return result;
  }

  private checkProduction() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException(
        'Seeder is disabled in production environment.',
      );
    }
  }
}

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ZonesSeedService } from './zones.seed';
import { CategoriesSeedService } from './categories.seed';
import { UsersSeedService } from './users.seed';
import { ProductsSeedService } from './products.seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly zonesSeedService: ZonesSeedService,
    private readonly categoriesSeedService: CategoriesSeedService,
    private readonly usersSeedService: UsersSeedService,
    private readonly productsSeedService: ProductsSeedService,
  ) {}

  async runAllSeeds() {
    this.logger.log('Starting database seeding process...');

    // The order of seeding is important due to dependencies
    await this.zonesSeedService.seed();
    await this.categoriesSeedService.seed();
    await this.usersSeedService.seed();
    await this.productsSeedService.seed();

    this.logger.log('Database seeding completed successfully.');
  }

  async getSeededDataStats(): Promise<Record<string, number>> {
    // FIX: Add a guard clause to ensure `this.connection.db` is not undefined.
    if (!this.connection.db) {
      this.logger.error(
        'Database connection is not available for seeding stats.',
      );
      throw new InternalServerErrorException(
        'Database connection not available.',
      );
    }

    // After the check, TypeScript knows `this.connection.db` is defined.
    const collections = await this.connection.db.collections();
    const stats: Record<string, number> = {};

    for (const collection of collections) {
      stats[collection.collectionName] = await collection.countDocuments();
    }

    return stats;
  }
}

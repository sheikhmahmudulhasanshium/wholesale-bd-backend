// src/app.service.ts

import { Injectable, ServiceUnavailableException } from '@nestjs/common'; // <-- UPDATE THIS IMPORT
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface HealthStatus {
  apiStatus: 'ok';
  dbStatus: 'connected' | 'disconnected';
  timestamp: string;
}

export interface DbStats {
  [collectionName: string]: number;
}

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'Welcome to the Wholesale BD API!';
  }

  getStatus(): HealthStatus {
    const dbStatus =
      (this.connection.readyState as number) === 1
        ? 'connected'
        : 'disconnected';

    return {
      apiStatus: 'ok',
      dbStatus,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves statistics for all collections in the database.
   * @returns A promise that resolves to an object mapping collection names to their document counts.
   */
  async getDbStats(): Promise<DbStats> {
    // +++ FIX: Add a guard clause to ensure the DB connection is ready +++
    if (!this.connection.db) {
      throw new ServiceUnavailableException(
        'Database connection is not available.',
      );
    }

    const collections = await this.connection.db.collections();
    const stats: DbStats = {};

    await Promise.all(
      collections.map(async (collection) => {
        const count = await collection.countDocuments();
        stats[collection.collectionName] = count;
      }),
    );

    const sortedStats = Object.keys(stats)
      .sort()
      .reduce((obj, key) => {
        obj[key] = stats[key];
        return obj;
      }, {});

    return sortedStats;
  }
}

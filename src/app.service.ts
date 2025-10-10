// src/app.service.ts

import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface HealthStatus {
  apiStatus: 'ok';
  dbStatus: 'connected' | 'disconnected';
  timestamp: string;
}

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'Welcome to the Wholesale BD API!';
  }

  // FIXED: Removed 'async' and 'Promise' as the operation is synchronous
  getStatus(): HealthStatus {
    // FIXED: Added type assertion '(this.connection.readyState as number)'
    // to fix the unsafe-enum-comparison lint error.
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
}

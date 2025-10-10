// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Express } from 'express';
import { join } from 'path';
import * as fs from 'fs'; // Import the file system module for debugging

let cachedServer: Express;

function configureCommonAppSettings(
  app: NestExpressApplication,
  envSuffix = '',
) {
  app.enableCors({
    origin:
      process.env.FRONTEND_URL || 'https://wholesale-bd-web-app.vercel.app',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`📦 Wholesale BD Backend ${envSuffix}`.trim())
    .setDescription(
      'The official API for the Wholesale BD B2B Platform. We connect manufacturers and wholesalers with retailers.',
    )
    .setVersion('1.0')
    .addTag('API Endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  const customSwaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: `Wholesale BD API Docs ${envSuffix}`.trim(),
    customfavIcon: '/favicon.ico',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCss: `
      .swagger-ui .topbar { background-color: #1e3a8a; }
      .swagger-ui .topbar .link, .swagger-ui .topbar .download-url-wrapper .select-label select { color: #FFFFFF; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #3b82f6; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #16a3a; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f97316; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #dc2626; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #f59e0b; }
    `,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };

  SwaggerModule.setup('api', app, document, customSwaggerOptions);
}

// This function will be the single source of truth for bootstrapping
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Define the path to the public directory
  const publicPath = join(process.cwd(), 'public');

  // --- START DEBUGGING BLOCK ---
  console.log(
    `[DEBUG] Current working directory (process.cwd()): ${process.cwd()}`,
  );
  console.log(`[DEBUG] Attempting to serve static assets from: ${publicPath}`);
  try {
    const files = fs.readdirSync(publicPath);
    console.log(`[DEBUG] Files found in public directory: ${files.join(', ')}`);
  } catch (error) {
    console.error(
      `[DEBUG] ERROR: Could not read public directory at ${publicPath}`,
      error,
    );
  }
  // --- END DEBUGGING BLOCK ---

  app.useStaticAssets(publicPath);

  configureCommonAppSettings(app); // Configure settings after setting up static assets

  return app;
}

async function bootstrapServerless(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }
  const app = await bootstrap(); // Use the common bootstrap function
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

async function bootstrapLocal() {
  const localApp = await bootstrap(); // Use the common bootstrap function
  configureCommonAppSettings(localApp, '(Local)'); // Re-apply for local suffix
  const port = process.env.PORT || 3001;
  await localApp.listen(port);
  console.log(
    `🚀 Wholesale BD Backend (Local) is running on: http://localhost:${port}`,
  );
  console.log(`🌐 Public index page available at: http://localhost:${port}/`);
  console.log(`📚 Swagger API docs available at: http://localhost:${port}/api`);
}

// This logic remains the same
if (!process.env.VERCEL) {
  bootstrapLocal().catch((err) => {
    console.error('Error during local bootstrap:', err);
    process.exit(1);
  });
}

export default bootstrapServerless();

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

// cachedServer is a common pattern for optimizing Vercel serverless function cold starts.
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

  // --- IMPORTANT NOTE ON SECURITY (HELMET) ---
  // The 'helmet' dependency is highly recommended for production security but was
  // omitted to match your provided pnpm list. Using helmet helps set crucial
  // security headers, including a Content-Security-Policy (CSP).
  //
  // Without helmet's CSP, you might see errors in the browser console on your
  // deployed Swagger UI page because it loads scripts/styles from a CDN.
  //
  // To fix this and improve security, run `pnpm install helmet` and add:
  //
  // import helmet from 'helmet';
  // app.use(helmet({ contentSecurityPolicy: false })); // A basic setup
  //
  // See the helmet-js documentation for more advanced CSP configurations.

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
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #16a34a; }
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

async function bootstrapServerless(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureCommonAppSettings(app);
  app.useStaticAssets('public');
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

async function bootstrapLocal() {
  const localApp = await NestFactory.create<NestExpressApplication>(AppModule);
  configureCommonAppSettings(localApp, '(Local)');
  localApp.useStaticAssets('public');
  const port = process.env.PORT || 3001;
  await localApp.listen(port);
  console.log(
    `🚀 Wholesale BD Backend (Local) is running on: http://localhost:${port}`,
  );
  console.log(`🌐 Public index page available at: http://localhost:${port}/`);
  console.log(`📚 Swagger API docs available at: http://localhost:${port}/api`);
}

if (!process.env.VERCEL) {
  bootstrapLocal().catch((err) => {
    console.error('Error during local bootstrap:', err);
    process.exit(1);
  });
}

export default bootstrapServerless();

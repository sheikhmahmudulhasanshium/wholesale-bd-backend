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
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Use the simplest path. The @vercel/nest builder makes this work.
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`📦 Wholesale BD Backend`)
    .setDescription('The official API for the Wholesale BD B2B Platform.')
    .setVersion('1.0')
    .addTag('API Endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);

  const customSwaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: `Wholesale BD API Docs`,
    customfavIcon: '/favicon.ico',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCss: `
      .swagger-ui .topbar { background-color: #1e3a8a; }
      .swagger-ui .topbar .link { color: #FFFFFF; }
    `,
  };

  SwaggerModule.setup('api', app, document, customSwaggerOptions);

  // For local development
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Local server running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs at: http://localhost:${port}/api`);
  }

  return app.getHttpAdapter().getInstance();
}

export default bootstrap();

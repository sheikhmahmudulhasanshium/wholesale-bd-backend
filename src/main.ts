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

// The function is now explicitly exported
export async function bootstrap() {
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

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`Backend Api documentation`)
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
      '/swagger-custom.js',
    ],
    customCss: `
      /* --- Top Bar Styles --- */
      .swagger-ui .topbar { 
        background-color: #1e3a8a; 
        height: 60px;
        padding: 0 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
      }
      .swagger-ui .topbar .topbar-wrapper {
         display: flex;
         align-items: center;
         width: 100%;
      }
      .swagger-ui .topbar a.link {
        display: none;
      }
      .custom-btn-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 15px;
      }
      .topbar-btn {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease;
      }
      .topbar-btn:hover { background-color: rgba(255, 255, 255, 0.25); }
      .topbar-btn:active { transform: translateY(1px); }
      #info-section-logo {
        width: 100%;
        max-width: 400px;
        height: 100px;
        margin-bottom: 20px;
        background-image: url("data:image/svg+xml,%3csvg width='168' height='84' viewBox='0 0 6 3' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='logo-symbol-gradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%2322C55E'/%3e%3cstop offset='100%25' stop-color='%2315803D'/%3e%3c/linearGradient%3e%3clinearGradient id='logo-text-gradient-flag' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3e%3cstop offset='0%25' stop-color='%23DC2626'/%3e%3cstop offset='100%25' stop-color='%23B91C1C'/%3e%3c/linearGradient%3e%3c/defs%3e%3cg%3e%3cg transform='translate(0.5, 1.5) scale(0.01)'%3e%3cpath d='M -50 -45 L 50 -50 L 45 50 L -45 40 Z' fill='url(%23logo-symbol-gradient)'/%3e%3cpath d='M -30 -47 A 35 35 0 0 1 30 -48' fill='none' stroke='%2316A3A' stroke-width='8' stroke-linecap='round'/%3e%3c/g%3e%3ctext x='0.5' y='1.5' font-family='Poppins, sans-serif' font-size='0.8' font-weight='700' fill='white' text-anchor='middle' dominant-baseline='middle'%3eW%3c/text%3e%3c/g%3e%3ctext x='1.2' y='1.5' fill='url(%23logo-text-gradient-flag)' font-family='Poppins, sans-serif' font-size='0.65' font-weight='bold' dominant-baseline='middle'%3eWholesale BD%3c/text%3e%3c/svg%3e");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: left center;
      }
      @media (max-width: 768px) {
        #info-section-logo {
          max-width: 300px;
          height: 75px;
        }
      }
      #back-to-top-btn {
        position: fixed; bottom: 25px; right: 25px; z-index: 1000;
        opacity: 0; visibility: hidden;
        transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, transform 0.2s ease;
        width: 45px; height: 45px; border-radius: 50%;
        background-image: linear-gradient(45deg, #3b82f6 0%, #2563eb 100%);
        color: white; border: none; cursor: pointer; font-size: 24px;
        line-height: 45px; text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      #back-to-top-btn.show { opacity: 1; visibility: visible; }
      #back-to-top-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.35); }
    `,
  };

  SwaggerModule.setup('api', app, document, customSwaggerOptions);

  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Local server running on: http://localhost:${port}`);
    console.log(`🌐 Public index page at: http://localhost:${port}/`);
    console.log(`📚 Swagger docs at: http://localhost:${port}/api`);
  }

  return app.getHttpAdapter().getInstance();
}

// THIS IS THE CORRECTED PART
// This structure is required for local execution but is ignored by the Vercel builder.
// Using 'void' explicitly tells ESLint that we are intentionally not awaiting this top-level promise.
if (!process.env.VERCEL) {
  void bootstrap();
}

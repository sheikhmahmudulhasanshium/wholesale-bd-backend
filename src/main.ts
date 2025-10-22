import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
// --- ADDED: Logger for consistent application logging ---
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// --- ADDED: Import the global exception filter ---
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // --- ADDED: Instantiate the logger for bootstrap messages ---
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin:
      process.env.FRONTEND_URL || 'https://wholesale-bd-web-app.vercel.app',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // --- ADDED: Register the global filter to catch all exceptions ---
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));

  // --- vvvvvvv THIS IS THE UPDATED SECTION vvvvvvv ---
  const swaggerDocConfig = new DocumentBuilder()
    .setTitle(`Backend Api documentation`)
    .setDescription('The official API for the Wholesale BD B2B Platform.')
    .setVersion('1.0')
    .addTag('API Endpoints')
    .addBearerAuth() // This correctly represents the new JWT authentication
    // --- REMOVED: The old .addApiKey() method call ---
    .build();
  // --- ^^^^^^^ THIS IS THE UPDATED SECTION ^^^^^^^ ---

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
        height: 60px; /* Standard header height */
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
        display: none; /* Hide default Swagger logo */
      }
      .custom-btn-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 15px;
      }
      
      /* Standard styles for our top bar buttons */
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

      /* --- Info Section Logo Styles --- */
      #info-section-logo {
        width: 100%;
        max-width: 400px; /* Prevent it from being huge on very wide screens */
        height: 100px; /* A nice, tall height for the logo */
        margin-bottom: 20px; /* Space between logo and the title */

        /* Your full logo SVG, URL-encoded and embedded */
        background-image: url("data:image/svg+xml,%3csvg width='168' height='84' viewBox='0 0 6 3' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='logo-symbol-gradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%2322C55E'/%3e%3cstop offset='100%25' stop-color='%2315803D'/%3e%3c/linearGradient%3e%3clinearGradient id='logo-text-gradient-flag' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3e%3cstop offset='0%25' stop-color='%23DC2626'/%3e%3cstop offset='100%25' stop-color='%23B91C1C'/%3e%3c/linearGradient%3e%3c/defs%3e%3cg%3e%3cg transform='translate(0.5, 1.5) scale(0.01)'%3e%3cpath d='M -50 -45 L 50 -50 L 45 50 L -45 40 Z' fill='url(%23logo-symbol-gradient)'/%3e%3cpath d='M -30 -47 A 35 35 0 0 1 30 -48' fill='none' stroke='%2316A34A' stroke-width='8' stroke-linecap='round'/%3e%3c/g%3e%3ctext x='0.5' y='1.5' font-family='Poppins, sans-serif' font-size='0.8' font-weight='700' fill='white' text-anchor='middle' dominant-baseline='middle'%3eW%3c/text%3e%3c/g%3e%3ctext x='1.2' y='1.5' fill='url(%23logo-text-gradient-flag)' font-family='Poppins, sans-serif' font-size='0.65' font-weight='bold' dominant-baseline='middle'%3eWholesale BD%3c/text%3e%3c/svg%3e");
        
        background-size: contain;
        background-repeat: no-repeat;
        background-position: left center; /* Align logo to the left */
      }

      /* Responsive styles for logo */
      @media (max-width: 768px) {
        #info-section-logo {
          max-width: 300px;
          height: 75px;
        }
      }

      /* "Back to Top" Button Styles (Unchanged) */
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
    logger.log(`🚀 Local server running on: http://localhost:${port}`);
    logger.log(`🌐 Public index page at: http://localhost:${port}/`);
    logger.log(`📚 Swagger docs at: http://localhost:${port}/api`);
  } else {
    await app.init();
  }

  return app.getHttpAdapter().getInstance();
}

export default bootstrap();

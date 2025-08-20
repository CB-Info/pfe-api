import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { swaggerConfig } from './configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security baseline: Helmet for HTTP headers security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"], // Allow connections to same origin for API calls
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger to work
    }),
  );

  // Enhanced ValidationPipe for input security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Rate limiting is configured globally via APP_GUARD in app.module.ts
  console.log('⚡ Rate Limiting enabled: 100 requests per 10 seconds');

  // CORS configuration - Simple and functional
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  // Add server's own origin for Swagger to work
  const port = process.env.PORT || 3000;
  const serverOrigin = `http://localhost:${port}`;
  if (!allowedOrigins.includes(serverOrigin)) {
    allowedOrigins.push(serverOrigin);
  }

  console.log('🔒 CORS Allowed Origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger documentation setup
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();

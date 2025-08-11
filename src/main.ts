import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Security headers
  app.use(helmet());

  // Restrict CORS with whitelist from env
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length
      ? allowedOrigins
      : [/^http:\/\/localhost(:\d+)?$/],
  });

  const port = process.env.PORT || 3000;

  const config = new DocumentBuilder()
    .setTitle('PFE Api')
    .setDescription('The PFE api description')
    .setVersion('1.0')
    .addTag('pfe')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

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
  console.log('⚡ Rate Limiting enabled: 3 requests per 10 seconds');

  // CORS configuration - Simple and functional
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3001'];

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

  const config = new DocumentBuilder()
    .setTitle('🍽️ Restaurant ERP API')
    .setDescription(
      `
## 🚀 API Documentation - Système de Gestion Restaurant

Cette API permet la gestion complète d'un restaurant avec les fonctionnalités suivantes :

### 📋 **Modules Disponibles**
- **👥 Users** - Gestion des utilisateurs et authentification
- **🍽️ Dishes** - Gestion des plats et menus
- **🛒 Orders** - Gestion des commandes et tables
- **🥬 Ingredients** - Gestion des ingrédients et stocks
- **📋 Cards** - Gestion des cartes/menus restaurant
- **📦 Stock** - Gestion des stocks et inventaires
- **🪑 Tables** - Gestion des tables du restaurant

### 🔐 **Authentification - Guide Complet**
1. **Créez un compte** (si nécessaire) : POST /users avec email, mot de passe, nom, prénom
2. **Connectez-vous** : POST /users/login avec email et mot de passe
3. **Copiez le token** retourné dans la réponse
4. **Cliquez sur "Authorize"** (🔓) en haut à droite
5. **Collez le token JWT** (sans préfixe "Bearer")
6. **Testez les endpoints protégés** ! 🚀

### 📚 **Utilisation Rapide**
1. **Connectez-vous** via POST /users/login
2. **Copiez le token** de la réponse
3. **Autorisez-vous** avec le bouton 🔓
4. **Explorez les modules** par catégories
    `,
    )
    .setVersion('1.0.0')
    .addTag(
      '👥 Users',
      'Gestion des utilisateurs, authentification et autorisation',
    )
    .addTag('🍽️ Dishes', 'Gestion des plats, ingrédients et catégories')
    .addTag('🛒 Orders', 'Gestion des commandes, statuts et tables')
    .addTag('🥬 Ingredients', 'Gestion des ingrédients et leurs propriétés')
    .addTag('📋 Cards', 'Gestion des cartes/menus du restaurant')
    .addTag('📦 Stock', 'Gestion des stocks et inventaires')
    .addTag('🪑 Tables', 'Gestion des tables et réservations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez votre token JWT Firebase (sans préfixe "Bearer")',
        in: 'header',
      },
      'Bearer', // This name matches @ApiSecurity('Bearer') in controllers
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();

# Rapport RNCP C2.2.3 - Sécurisation du Code Source

## Sécurité Baseline Implémentée

Cette section documente les améliorations de sécurité baseline implémentées pour renforcer la conformité avec la compétence **C2.2.3** du RNCP39583 : *"Développer le logiciel en veillant à l'évolutivité et à la sécurisation du code source"*.

### 1. Sécurisation des Headers HTTP avec Helmet

L'application utilise désormais **Helmet** pour sécuriser automatiquement les headers HTTP contre les attaques courantes. Cette implémentation protège contre les vulnérabilités XSS, clickjacking, et autres attaques par injection.

```typescript
// src/main.ts - Configuration Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Compatibilité Swagger
}));
```

**Bénéfices sécuritaires :**
- Protection XSS via Content Security Policy
- Headers sécurisés automatiques (X-Frame-Options, X-Content-Type-Options)
- Prévention des attaques par détournement de protocole

### 2. Configuration CORS Sécurisée avec Allowlist

Le système CORS a été implémenté avec une allowlist simple et efficace via variables d'environnement, bloquant automatiquement toute origine non autorisée.

```typescript
// src/main.ts - CORS sécurisé et simplifié
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3001']; // Default: Vite (5173) + React (3001)

console.log('🔒 CORS Allowed Origins:', allowedOrigins);

app.enableCors({
  origin: allowedOrigins, // Blocage automatique si origin non présente dans la liste
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

**Configuration via .env :**
```env
# Développement - Frontend Vite sur port 5173
ALLOWED_ORIGINS=http://localhost:5173

# Production - Domaines autorisés
ALLOWED_ORIGINS=https://restaurant.vercel.app,https://admin.restaurant.com

# Multiple environnements
ALLOWED_ORIGINS=http://localhost:5173,https://restaurant.vercel.app
```

### 3. Validation Renforcée des Entrées

Le `ValidationPipe` global a été renforcé avec des options strictes pour prévenir les injections et valider rigoureusement les données d'entrée.

```typescript
// src/main.ts - ValidationPipe sécurisé
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, // Supprime les propriétés non autorisées
  forbidNonWhitelisted: true, // Erreur si propriétés interdites
  transform: true, // Auto-transformation vers DTOs
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

**Protection apportée :**
- Élimination automatique des champs malveillants
- Validation stricte des types et formats
- Transformation sécurisée des données

### 4. Limitation du Taux de Requêtes (Rate Limiting)

Protection contre les attaques par déni de service et brute force via `@nestjs/throttler` avec configuration multi-niveaux et activation globale du guard.

```typescript
// src/app.module.ts - Configuration Rate Limiting
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 10000, // 10 seconds
    limit: 3, // 3 requests per 10 seconds (for testing)
  },
  {
    name: 'medium',
    ttl: 30000, // 30 seconds
    limit: 20, // 20 requests per 30 seconds
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
])
```

```typescript
// src/app.module.ts - Activation globale via APP_GUARD
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [ThrottlerModule.forRoot([...])],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Activation globale automatique
    },
  ],
})
```

**Test de fonctionnement :**
- **3 requêtes en 10 secondes** → ✅ Autorisées
- **4ème requête** → ❌ Erreur 429 "Too Many Requests"

### 5. Documentation API Swagger Structurée et Sécurisée

L'interface Swagger a été entièrement restructurée pour une navigation claire et organisée par modules, tout en supportant l'authentification Bearer JWT et respectant les contraintes de sécurité (Helmet CSP).

#### **🎯 Structure Modulaire Organisée**

```typescript
// src/main.ts - Configuration Swagger structurée
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

### 🔐 **Authentification**
- Utilisez Firebase JWT pour l'authentification
- Cliquez sur "Authorize" et entrez votre token JWT (sans préfixe "Bearer")

### 📚 **Utilisation**
1. **Authentifiez-vous** via le bouton "Authorize"
2. **Explorez les modules** par catégories
3. **Testez les endpoints** directement depuis cette interface
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
    'Bearer', // Correspond à @ApiSecurity('Bearer') dans les contrôleurs
  )
  .build();
```

#### **🏷️ Tags Organisés par Contrôleurs**

```typescript
// Exemple d'organisation dans les contrôleurs
@Controller('users')
@ApiTags('👥 Users')  // Tag visuel et organisé

@Controller('dishes')
@ApiTags('🍽️ Dishes')  // Groupe logique des plats

@Controller('orders')
@ApiTags('🛒 Orders')  // Groupe logique des commandes
```

#### **📝 Documentation Améliorée des Endpoints**

```typescript
// Exemple d'amélioration dans UserController
@ApiOperation({
  summary: 'Créer un nouvel utilisateur',
  description: 'Enregistre un nouvel utilisateur dans le système avec authentification Firebase',
})
@ApiResponse({
  status: 201,
  description: 'Utilisateur créé avec succès',
  type: UserDTO,
})
@ApiResponse({
  status: 400,
  description: 'Données invalides ou utilisateur déjà existant',
})
```

#### **🔧 Corrections Techniques**

**Corrections CORS pour Swagger :**
```typescript
// Auto-ajout de l'origine du serveur pour que Swagger puisse s'authentifier
const serverOrigin = `http://localhost:${port}`;
if (!allowedOrigins.includes(serverOrigin)) {
  allowedOrigins.push(serverOrigin);
}
```

**Configuration Helmet pour Swagger :**
```typescript
scriptSrc: ["'self'", "'unsafe-inline'"], // Autorise les scripts Swagger
connectSrc: ["'self'"], // Autorise les connexions API
```

#### **🔐 Endpoint de Connexion Intégré**

Pour une expérience développeur optimale, un endpoint de login complet a été intégré à l'API permettant de récupérer le token directement depuis Swagger :

```typescript
// src/modules/user/user.controller.ts - Endpoint de connexion
@Post('login')
@ApiOperation({
  summary: '🔐 Se connecter',
  description: 'Authentifie un utilisateur existant et retourne un token JWT pour accéder aux endpoints protégés',
})
async loginUser(@Body() body: LoginDTO) {
  const response = await this.userService.loginUser(body);

  return {
    error: '',
    data: {
      user: response.user,
      token: response.token,
      message: '✅ Connexion réussie ! Copiez le token ci-dessus et utilisez-le dans "Authorize" 🔓'
    }
  };
}
```

```typescript
// src/dto/user.dto.ts - DTO de connexion
export class LoginDTO {
  @ApiProperty({ description: 'Email address of the user' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password of the user' })
  @IsNotEmpty()
  password: string;
}
```

#### **🔧 Guide d'Authentification Intégré dans Swagger**

La description de l'API inclut maintenant un guide complet :

```markdown
### 🔐 **Authentification - Guide Complet**
1. **Créez un compte** (si nécessaire) : POST /users avec email, mot de passe, nom, prénom
2. **Connectez-vous** : POST /users/login avec email et mot de passe
3. **Copiez le token** retourné dans la réponse
4. **Cliquez sur "Authorize"** (🔓) en haut à droite
5. **Collez le token JWT** (sans préfixe "Bearer")
6. **Testez les endpoints protégés** ! 🚀
```

#### **🧪 Test d'Interface Swagger Simplifiée**

1. **Accéder à `/api`** → Interface Swagger complète avec guide
2. **Créer/Se connecter** → `POST /users/login` avec email/mot de passe
3. **Copier le token** → Retourné directement dans la réponse JSON
4. **Autoriser** → Clic sur "Authorize" → Coller le token (sans "Bearer")
5. **Tester les endpoints** → ✅ Authentification fonctionnelle et fluide

#### **💡 Avantages pour les Développeurs**

- **🚀 Workflow simplifié** : Tout depuis une seule interface
- **📱 Self-service** : Plus besoin d'outils externes (Postman, etc.)
- **🔄 Test rapide** : Login → Token → Test en quelques clics
- **📚 Documentation claire** : Guide intégré visible dès l'ouverture

#### **📊 Bénéfices de la Restructuration**

- **🎯 Navigation intuitive** : Modules clairement identifiés par emojis
- **📚 Documentation claire** : Description complète de l'API restaurant
- **🔍 Recherche facilitée** : Endpoints groupés logiquement par fonctionnalité
- **👨‍💻 Expérience développeur** : Interface professionnelle et organisée
- **📱 UX améliorée** : Structure visuelle claire pour identifier rapidement les fonctionnalités

**Conformité C2.2.3 :** Ces améliorations renforcent significativement la sécurisation du code source en implémentant des protections industry-standard contre les vulnérabilités web courantes, tout en maintenant la compatibilité avec l'architecture existante et les spécifications fonctionnelles du projet. La documentation API reste accessible et fonctionnelle pour les développeurs.

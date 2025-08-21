# ⚙️ Configuration - C2.4.1

## 1. Vue d'ensemble de la configuration

### Gestion centralisée
L'API Eatopia utilise un système de configuration centralisé basé sur :
- **Variables d'environnement** - Configuration runtime
- **Validation Joi** - Vérification des valeurs
- **Configuration par environnement** - Dev/Staging/Production
- **Script de validation** - `validate-env.js`

### Principe de sécurité
- ✅ **Aucun secret dans le code** - Tout via variables d'environnement
- ✅ **Validation stricte** - Types et formats contrôlés
- ✅ **Valeurs par défaut sécurisées** - Configuration minimale fonctionnelle
- ✅ **Documentation complète** - Chaque variable expliquée

---

## 2. Variables d'environnement

### 2.1 Variables obligatoires

#### **MONGO_URL**
```bash
# Description: Chaîne de connexion MongoDB
# Format: mongodb://[username:password@]host[:port]/database
# Exemples:
MONGO_URL=mongodb://localhost:27017/eatopia-dev          # Local
MONGO_URL=mongodb+srv://user:pass@cluster.net/eatopia    # Production
```

#### **API_KEY**
```bash
# Description: Clé d'authentification API
# Exemples:
API_KEY=dev-api-key    # Dev
API_KEY=prod-api-key    # Prod
```

### 2.2 Variables optionnelles

#### **PORT**
```bash
# Description: Port d'écoute du serveur
# Format: Nombre entre 1 et 65535
# Défaut: 3000
# Exemples:
PORT=3000      # Développement
PORT=10000     # Render (auto-configuré)
```

#### **NODE_ENV**
```bash
# Description: Environnement d'exécution
# Format: development | production | test
# Défaut: development
# Exemples:
NODE_ENV=development  # Local
NODE_ENV=production   # Render
NODE_ENV=test        # Tests automatisés
```

#### **ALLOWED_ORIGINS**
```bash
# Description: Origines autorisées pour CORS (séparées par virgules)
# Format: Liste d'URLs complètes
# Défaut: http://localhost:3000,http://localhost:5173
# Exemples:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173                    # Dev
ALLOWED_ORIGINS=https://pfe-api-fbyd.onrender.com,https://pfe-web-weld.vercel.app/        # Prod
```

### 2.3 Variables Firebase (conditionnelles)

#### **Configuration via fichier credentials.json**
```bash
# Emplacement du fichier:
# - Local: src/configs/credentials.json
# - Render: /etc/secrets/credentials.json

# Contenu (exemple):
{
  "type": "service_account",
  "project_id": "eatopia-firebase-project",
  "private_key_id": "key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

---

## 3. Configuration par environnement

### 3.1 Développement local (.env)
```env
# Fichier .env pour développement
NODE_ENV=development
PORT=3000

# Base de données locale
MONGO_URL=mongodb://localhost:27017/eatopia-dev

# Sécurité (clés de développement)
API_KEY=dev-api-key-32-characters-minimum-required-here

# CORS permissif pour développement
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4200

# Debug (optionnel)
DEBUG=eatopia:*
LOG_LEVEL=debug
```

### 3.2 Staging (Render)
```env
# Variables Render pour branche develop
NODE_ENV=staging
PORT=10000  # Auto-configuré par Render

# Base de données staging
MONGO_URL=mongodb+srv://staging-user:password@cluster.net/eatopia-staging

# Sécurité
API_KEY=staging-secure-api-key-32-chars-minimum

# CORS restrictif
ALLOWED_ORIGINS=https://pfe-api-fbyd-staging.onrender.com,https://pfe-lntyiywla-perso-73694422.vercel.app/

# Monitoring
LOG_LEVEL=info
```

### 3.3 Production (Render)
```env
# Variables Render pour branche main
NODE_ENV=production
PORT=10000  # Auto-configuré par Render

# Base de données production
MONGO_URL=mongodb+srv://prod-user:secure-password@cluster.net/eatopia

# Sécurité renforcée
API_KEY=production-ultra-secure-api-key-64-characters-minimum

# CORS très restrictif
ALLOWED_ORIGINS=https://pfe-api-fbyd-staging.onrender.com,https://pfe-api-fbyd.onrender.com

# Monitoring production
LOG_LEVEL=warn
SENTRY_DSN=https://...@sentry.io/project-id
```

---

## 4. Validation de configuration

### 4.1 Script de validation
```bash
# Commande de validation
npm run validate-env

# Validation avec génération d'exemple
npm run validate-env:example
```

### 4.2 Schéma de validation Joi
```typescript
// src/configs/config.ts
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  MONGO_URL: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base': 'MONGO_URL must be a valid MongoDB connection string'
    }),

  API_KEY: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'API_KEY must be at least 32 characters long'
    }),

  ALLOWED_ORIGINS: Joi.string()
    .optional(),
});
```

### 4.3 Validation au démarrage
```typescript
// Validation automatique au boot
async function bootstrap() {
  try {
    const config = configValidationSchema.validate(process.env);
    if (config.error) {
      console.error('❌ Configuration validation failed:');
      console.error(config.error.details);
      process.exit(1);
    }

    console.log('✅ Configuration validated successfully');
    // ... démarrage de l'application
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}
```

---

## 5. Configuration des services externes

### 5.1 MongoDB
```typescript
// Configuration Mongoose
MongooseModule.forRoot(config().mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: process.env.NODE_ENV === 'production',
  authSource: 'admin',
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,        // Pool de connexions
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 5.2 Firebase Admin
```typescript
// Configuration Firebase dynamique
const getFirebaseConfig = () => {
  const secretPath = '/etc/secrets/credentials.json';      // Render
  const localPath = './src/configs/credentials.json';     // Local

  if (fs.existsSync(secretPath)) {
    return JSON.parse(fs.readFileSync(secretPath, 'utf8'));
  } else if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  } else {
    throw new Error('❌ Firebase credentials not found');
  }
};
```

### 5.3 Swagger/OpenAPI
```typescript
// Configuration Swagger par environnement
const swaggerConfig = new DocumentBuilder()
  .setTitle('🍽️ Eatopia API')
  .setDescription('Restaurant ERP API Documentation')
  .setVersion('1.0.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  }, 'Bearer')
  .build();

// Activation conditionnelle
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api', app, document);
}
```

---

## 6. Configuration de sécurité

### 6.1 Rate Limiting
```typescript
// Configuration par environnement
const getRateLimitConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return [
      { name: 'short', ttl: 60000, limit: 50 },    // Production stricte
      { name: 'medium', ttl: 300000, limit: 200 },
      { name: 'long', ttl: 900000, limit: 1000 },
    ];
  } else {
    return [
      { name: 'short', ttl: 10000, limit: 100 },   // Développement permissif
      { name: 'medium', ttl: 30000, limit: 200 },
      { name: 'long', ttl: 60000, limit: 1000 },
    ];
  }
};
```

### 6.2 CORS par environnement
```typescript
// Configuration CORS adaptative
const getCorsConfig = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : getDefaultOrigins();

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
};
```

### 6.3 Headers de sécurité
```typescript
// Configuration Helmet par environnement
const getHelmetConfig = () => {
  const baseConfig = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  };

  if (process.env.NODE_ENV === 'development') {
    // Swagger nécessite des permissions supplémentaires
    baseConfig.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-inline'");
    baseConfig.crossOriginEmbedderPolicy = false;
  }

  return baseConfig;
};
```

---

## 7. Gestion des configurations sensibles

### 7.1 Hiérarchie des sources
```typescript
// Ordre de priorité (du plus élevé au plus bas)
1. Variables d'environnement système
2. Fichier .env (développement uniquement)
3. Valeurs par défaut du code
4. Configuration par défaut Joi
```

### 7.2 Masquage des valeurs sensibles
```typescript
// Affichage sécurisé de la configuration
const displayConfig = (config: any) => {
  const masked = { ...config };

  // Masquer les valeurs sensibles
  if (masked.apiKey) masked.apiKey = `${masked.apiKey.slice(0, 4)}****`;
  if (masked.mongoUrl) masked.mongoUrl = masked.mongoUrl.replace(/:([^:@]+)@/, ':****@');

  console.log('📋 Configuration loaded:', masked);
};
```

### 7.3 Rotation des secrets
```bash
# Procédure de rotation API_KEY
1. Générer nouvelle clé: openssl rand -hex 32
2. Mettre à jour variables d'environnement
3. Redémarrer l'application
4. Vérifier fonctionnement
5. Révoquer ancienne clé
6. Notifier l'équipe
```

---

## 8. Configuration du monitoring

### 8.1 Logs structurés
```typescript
// Configuration Winston (production)
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
};
```

### 8.2 Health checks
```typescript
// Configuration des vérifications de santé
const healthConfig = {
  database: {
    timeout: 5000,
    retries: 3,
  },
  firebase: {
    timeout: 3000,
    retries: 2,
  },
  external: {
    timeout: 10000,
    retries: 1,
  },
};
```

### 8.3 Métriques applicatives
```typescript
// Configuration Prometheus (optionnel)
const metricsConfig = {
  enabled: process.env.METRICS_ENABLED === 'true',
  endpoint: '/metrics',
  defaultLabels: {
    app: 'eatopia-api',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  },
};
```

---

## 9. Scripts de configuration

### 9.1 Validation complète
```bash
# scripts/validate-env.js
#!/usr/bin/env node

const REQUIRED_VARIABLES = [
  {
    name: 'MONGO_URL',
    description: 'MongoDB connection string',
    validator: (value) => value && (
      value.startsWith('mongodb://') ||
      value.startsWith('mongodb+srv://')
    ),
    example: 'mongodb://localhost:27017/eatopia',
  },
  {
    name: 'API_KEY',
    description: 'API authentication key',
    validator: (value) => value && value.length >= 32,
    example: 'your-secure-api-key-here-min-32-chars',
  },
];
```

### 9.2 Génération d'exemple
```bash
# Génération automatique de .env.example
npm run validate-env:example

# Contenu généré:
# Environment Configuration
# Copy this file to .env and fill in your actual values

NODE_ENV=development
PORT=3000
MONGO_URL=mongodb://localhost:27017/eatopia
API_KEY=your-secure-api-key-here-min-32-chars
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 9.3 Validation CI/CD
```yaml
# GitHub Actions - Validation des variables
- name: Validate environment variables
  run: npm run validate-env
  env:
    MONGO_URL: ${{ secrets.MONGO_URL }}
    API_KEY: ${{ secrets.API_KEY }}
    NODE_ENV: production
```

---

## 10. Configuration des tests

### 10.1 Environnement de test
```typescript
// Configuration Jest
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
  ],
};
```

### 10.2 Variables de test
```env
# .env.test (automatiquement chargé par Jest)
NODE_ENV=test
MONGO_URL=mongodb://localhost:27017/eatopia-test
API_KEY=test-api-key-32-characters-minimum-required
ALLOWED_ORIGINS=http://localhost:3000
```

### 10.3 MongoDB Memory Server
```typescript
// Configuration base de données en mémoire pour tests
export const getTestDatabaseConfig = () => ({
  uri: global.__MONGO_URI__,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 1,  // Pool minimal pour tests
});
```

---

## 11. Configuration de production

### 11.1 Optimisations performance
```typescript
// Configuration production optimisée
if (process.env.NODE_ENV === 'production') {
  // Compression des réponses
  app.use(compression());

  // Cache des headers statiques
  app.use(helmet({
    hsts: {
      maxAge: 31536000,  // 1 an
      includeSubDomains: true,
    },
  }));

  // Limitation stricte des requêtes
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requêtes par IP
  }));
}
```

### 11.2 Configuration logging production
```typescript
// Logs structurés pour production
const productionLogger = {
  level: 'warn',  // Seuls warnings et erreurs
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
  ],
};
```

### 11.3 Sécurité production
```typescript
// Configuration sécurité renforcée
if (process.env.NODE_ENV === 'production') {
  // Masquage des erreurs détaillées
  app.useGlobalFilters(new ProductionExceptionFilter());

  // Headers de sécurité stricts
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
  }));
}
```

---

## 12. Troubleshooting configuration

### 12.1 Problèmes courants

#### **Erreur : "MONGO_URL is required"**
```bash
# Vérification
echo $MONGO_URL  # Doit retourner une valeur

# Solution
export MONGO_URL="mongodb://localhost:27017/eatopia"
# OU éditer le fichier .env
```

#### **Erreur : "API_KEY must be at least 32 characters"**
```bash
# Génération d'une clé sécurisée
openssl rand -hex 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **Erreur : "Firebase credentials not found"**
```bash
# Vérifier l'emplacement du fichier
ls -la src/configs/credentials.json     # Local
ls -la /etc/secrets/credentials.json    # Render

# Télécharger depuis Firebase Console
# Projet Firebase > Paramètres > Comptes de service > Générer nouvelle clé
```

### 12.2 Debug de configuration
```typescript
// Mode debug pour diagnostic
if (process.env.DEBUG_CONFIG === 'true') {
  console.log('🔍 Debug configuration:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('MONGO_URL:', process.env.MONGO_URL ? '[SET]' : '[NOT SET]');
  console.log('API_KEY length:', process.env.API_KEY?.length || 0);
  console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
}
```

### 12.3 Validation continue
```bash
# Tests de configuration dans CI/CD
- name: Validate configuration
  run: |
    npm run validate-env
    npm run test:config  # Tests spécifiques config
```

---

## 13. Migration et mise à jour

### 13.1 Ajout de nouvelles variables
```typescript
// 1. Ajouter dans le schéma Joi
NOUVELLE_VARIABLE: Joi.string().optional().default('valeur-defaut'),

// 2. Ajouter dans la fonction config
export default () => ({
  // ... variables existantes
  nouvelleVariable: process.env.NOUVELLE_VARIABLE,
});

// 3. Mettre à jour .env.example
NOUVELLE_VARIABLE=exemple-de-valeur

// 4. Documenter dans CONFIGURATION.md
```

### 13.2 Suppression de variables obsolètes
```bash
# Procédure de suppression sécurisée
1. Marquer comme deprecated dans le code
2. Logger un warning si utilisée
3. Attendre 2 versions mineures
4. Supprimer du schéma de validation
5. Supprimer du code
6. Mettre à jour la documentation
```

### 13.3 Migration de configuration
```typescript
// Script de migration automatique
export const migrateConfig = () => {
  // Exemple: Renommage d'une variable
  if (process.env.OLD_VARIABLE_NAME && !process.env.NEW_VARIABLE_NAME) {
    console.warn('⚠️ OLD_VARIABLE_NAME is deprecated, use NEW_VARIABLE_NAME');
    process.env.NEW_VARIABLE_NAME = process.env.OLD_VARIABLE_NAME;
  }
};
```

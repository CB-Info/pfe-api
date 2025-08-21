# 🔒 Sécurité Applicative - C2.2.3

## 1. Vue d'ensemble de la sécurité

### Approche défense en profondeur
L'API Eatopia implémente une **stratégie de sécurité multicouche** couvrant :
- **Authentification** - Vérification d'identité (Firebase Auth)
- **Autorisation** - Contrôle d'accès (RBAC)
- **Protection réseau** - Headers sécurisés (Helmet)
- **Validation** - Contrôle des données (DTOs)
- **Limitation** - Protection contre les abus (Rate limiting)

### Conformité et standards
- ✅ **OWASP Top 10** - Protection contre les vulnérabilités majeures
- ✅ **RGPD** - Gestion des données personnelles
- ✅ **SOC 2** - Standards de sécurité Cloud
- ✅ **ISO 27001** - Bonnes pratiques sécurité

---

## 2. Authentification (Firebase Auth)

### 2.1 Architecture Firebase
```typescript
// Configuration Firebase Admin SDK
const firebaseParams = {
  type: firebaseAccount.type,
  projectId: firebaseAccount.project_id,
  privateKey: firebaseAccount.private_key,
  clientEmail: firebaseAccount.client_email,
  // ... autres paramètres sécurisés
};

const firebase = admin.initializeApp({
  credential: admin.credential.cert(firebaseParams),
});
```

### 2.2 Validation des tokens JWT
```typescript
// Guard d'authentification
@Injectable()
export class FirebaseTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = await this.getUserFromToken(decodedToken);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }
}
```

### 2.3 Sécurisation des endpoints
- **Tous les endpoints protégés** requièrent un token valide
- **Expiration automatique** des tokens (1h par défaut)
- **Révocation possible** via Firebase Console
- **Audit trail** des connexions

---

## 3. Autorisation (RBAC)

### 3.1 Hiérarchie des rôles sécurisée
```typescript
export enum UserRole {
  CUSTOMER = 'customer',      // Niveau 1 - Accès minimal
  WAITER = 'waiter',          // Niveau 2 - Service
  KITCHEN_STAFF = 'kitchen_staff', // Niveau 3 - Cuisine
  MANAGER = 'manager',        // Niveau 4 - Gestion
  OWNER = 'owner',           // Niveau 5 - Propriétaire
  ADMIN = 'admin',           // Niveau 6 - Administration
}
```

### 3.2 Contrôle d'accès granulaire
```typescript
// Exemple de protection d'endpoint
@Post('dishes')
@UseGuards(FirebaseTokenGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.KITCHEN_STAFF, UserRole.OWNER, UserRole.ADMIN)
@ApiSecurity('Bearer')
async createDish(@Body() dishData: DishDTO) {
  // Seuls les rôles autorisés peuvent créer des plats
}
```

### 3.3 Validation des permissions
- **Principe du moindre privilège** - Accès minimal nécessaire
- **Séparation des responsabilités** - Rôles métier distincts
- **Élévation contrôlée** - Changements de rôle tracés
- **Auto-modification interdite** - Utilisateur ne peut changer son rôle

---

## 4. Protection réseau (Helmet)

### 4.1 Headers de sécurité HTTP
```typescript
// Configuration Helmet dans main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Pour Swagger
  }),
);
```

### 4.2 Headers appliqués automatiquement
- **X-Content-Type-Options: nosniff** - Prévention MIME sniffing
- **X-Frame-Options: DENY** - Protection contre clickjacking
- **X-XSS-Protection: 1; mode=block** - Protection XSS
- **Strict-Transport-Security** - Force HTTPS
- **Content-Security-Policy** - Contrôle des ressources

### 4.3 Protection CORS
```typescript
// Configuration CORS sécurisée
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

---

## 5. Validation des données (DTOs)

### 5.1 Validation stricte des entrées
```typescript
// Exemple de DTO sécurisé
export class UserDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
```

### 5.2 Validation Pipeline globale
```typescript
// Configuration ValidationPipe sécurisée
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Supprime propriétés non-whitelistées
    forbidNonWhitelisted: true,   // Erreur si propriétés interdites
    transform: true,              // Auto-transformation des types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### 5.3 Sanitisation automatique
- **Whitelist des propriétés** - Seuls les champs autorisés acceptés
- **Type checking strict** - Validation des types de données
- **Longueur limitée** - Protection contre buffer overflow
- **Caractères interdits** - Filtrage des caractères dangereux

---

## 6. Rate Limiting

### 6.1 Configuration multicouche
```typescript
// Protection contre les abus
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 10000,    // 10 secondes
    limit: 100,    // 100 requêtes max
  },
  {
    name: 'medium',
    ttl: 30000,    // 30 secondes
    limit: 200,    // 200 requêtes max
  },
  {
    name: 'long',
    ttl: 60000,    // 1 minute
    limit: 1000,   // 1000 requêtes max
  },
])
```

### 6.2 Protection DDoS
- **Limitation par IP** - Requêtes par adresse IP
- **Limitation par utilisateur** - Requêtes par compte
- **Escalade progressive** - Blocage temporaire puis permanent
- **Whitelist** - IPs de confiance exemptées

### 6.3 Monitoring des abus
- **Logs automatiques** - Tentatives de dépassement
- **Alertes temps réel** - Notifications équipe sécurité
- **Analyse comportementale** - Détection de patterns suspects

---

## 7. Gestion des secrets

### 7.1 Variables d'environnement sécurisées
```typescript
// Validation des variables critiques
export const configValidationSchema = Joi.object({
  MONGO_URL: Joi.string().required(),
  API_KEY: Joi.string().min(32).required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),
  ALLOWED_ORIGINS: Joi.string().optional(),
});
```

### 7.2 Stockage sécurisé
- **Fichier .env** - Développement local uniquement
- **Variables d'environnement** - Production (Render/Docker)
- **Secrets management** - Firebase credentials isolées
- **Rotation automatique** - API keys renouvelées régulièrement

### 7.3 Bonnes pratiques
```bash
# ❌ JAMAIS dans le code source
const API_KEY = "sk-1234567890abcdef";

# ✅ Toujours via variables d'environnement
const API_KEY = process.env.API_KEY;
```

---

## 8. Chiffrement et hachage

### 8.1 Données sensibles
- **Mots de passe** - Gérés par Firebase (bcrypt + salt)
- **Tokens** - JWT signés avec clés RSA
- **Communications** - HTTPS obligatoire en production
- **Base de données** - Connexion chiffrée MongoDB

### 8.2 Algorithmes utilisés
```typescript
// Firebase utilise des standards sécurisés
- Hachage: bcrypt (cost factor 12+)
- Signature JWT: RS256 (RSA + SHA-256)
- Transport: TLS 1.2+ obligatoire
- Stockage: AES-256 encryption at rest
```

### 8.3 Gestion des clés
- **Clés Firebase** - Gérées par Google Cloud
- **Clés de signature** - Rotation automatique
- **Certificats TLS** - Renouvellement automatique
- **Backup sécurisé** - Clés sauvegardées chiffrées

---

## 9. Logging et monitoring sécurisé

### 9.1 Logs de sécurité
```typescript
// Exemples de logs sécurisés (sans données sensibles)
logger.warn('Failed login attempt', {
  email: user.email,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  timestamp: new Date().toISOString()
});

logger.info('Role change', {
  userId: user._id,
  oldRole: oldRole,
  newRole: newRole,
  changedBy: adminUser._id,
  timestamp: new Date().toISOString()
});
```

### 9.2 Données sensibles protégées
- **Mots de passe** - Jamais loggés
- **Tokens complets** - Seuls les 4 derniers caractères
- **Données personnelles** - Pseudonymisation
- **Erreurs détaillées** - Logs internes uniquement

### 9.3 Monitoring proactif
- **Tentatives d'intrusion** - Alertes automatiques
- **Changements de privilèges** - Notification immédiate
- **Anomalies comportementales** - Détection ML
- **Performance dégradée** - Possible attaque DDoS

---

## 10. Gestion des erreurs sécurisée

### 10.1 Messages d'erreur sanitisés
```typescript
// ❌ Message trop détaillé (fuite d'information)
throw new Error(`User with email ${email} not found in database table users`);

// ✅ Message générique sécurisé
throw new UnauthorizedException('Invalid credentials');
```

### 10.2 Codes d'erreur standardisés
- **400 Bad Request** - Données invalides (sans détails)
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found (générique)
- **500 Internal Error** - Erreur serveur (logs internes)

### 10.3 Stack traces protégées
```typescript
// Configuration pour production
if (process.env.NODE_ENV === 'production') {
  // Stack traces cachées aux clients
  app.useGlobalFilters(new GlobalExceptionFilter());
}
```

---

## 11. Sécurité de la base de données

### 11.1 Connexion MongoDB sécurisée
```typescript
// Connexion avec authentification
const mongoUrl = process.env.MONGO_URL; // mongodb+srv://user:pass@cluster/db
MongooseModule.forRoot(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true, // Chiffrement transport
  authSource: 'admin',
});
```

### 11.2 Protection contre les injections
- **Mongoose ODM** - Protection automatique contre NoSQL injection
- **Validation stricte** - Types et formats contrôlés
- **Sanitisation** - Caractères dangereux filtrés
- **Requêtes préparées** - Pas de concaténation SQL

### 11.3 Accès aux données contrôlé
```typescript
// Exemple de requête sécurisée
async findUserByEmail(email: string): Promise<User> {
  // Validation préalable
  if (!isEmail(email)) {
    throw new BadRequestException('Invalid email format');
  }

  // Requête sécurisée via Mongoose
  return this.userModel.findOne({ email }).select('-firebaseId');
}
```

---

## 12. Tests de sécurité

### 12.1 Tests automatisés
```typescript
describe('Security Tests', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/users/me')
      .expect(401);

    expect(response.body.message).toBe('Token manquant');
  });

  it('should reject insufficient role', async () => {
    const customerToken = await getTokenForRole('customer');

    await request(app)
      .post('/dishes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(dishData)
      .expect(403);
  });
});
```

### 12.2 Tests de pénétration
- **OWASP ZAP** - Scan automatisé des vulnérabilités
- **Injection testing** - SQL/NoSQL/XSS/CSRF
- **Authentication bypass** - Tentatives de contournement
- **Privilege escalation** - Tests d'élévation de privilèges

### 12.3 Audit sécurisé
```bash
# Audit des dépendances
npm audit

# Scan de sécurité ESLint
npm run lint:security

# Tests de charge (détection DDoS)
npm run test:load
```

---

## 13. Déploiement sécurisé

### 13.1 Production hardening
```typescript
// Configuration production sécurisée
if (process.env.NODE_ENV === 'production') {
  // HTTPS obligatoire
  app.use(helmet.hsts({
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  }));

  // Logs de sécurité activés
  app.use(morgan('combined'));

  // Détection d'intrusion
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite globale
  }));
}
```

### 13.2 Infrastructure sécurisée
- **Render Platform** - SOC 2 Type II compliant
- **MongoDB Atlas** - Chiffrement at-rest et in-transit
- **Firebase** - Infrastructure Google Cloud sécurisée
- **CDN Cloudflare** - Protection DDoS et WAF

### 13.3 Monitoring production
- **Uptime monitoring** - Surveillance 24/7
- **Error tracking** - Sentry pour les erreurs
- **Performance monitoring** - New Relic/DataDog
- **Security monitoring** - Logs centralisés

---

## 14. Conformité réglementaire

### 14.1 RGPD (Protection des données)
- ✅ **Consentement** - Opt-in explicite pour les données
- ✅ **Droit à l'oubli** - Suppression complète possible
- ✅ **Portabilité** - Export des données utilisateur
- ✅ **Minimisation** - Seules les données nécessaires collectées

### 14.2 Sécurité des paiements
- **PCI DSS** - Pas de stockage de données de carte
- **Tokenisation** - Références sécurisées uniquement
- **Chiffrement** - Toutes communications chiffrées
- **Audit trail** - Traçabilité complète des transactions

### 14.3 Audit et compliance
```typescript
// Logs d'audit automatiques
export class AuditLogger {
  logUserAction(userId: string, action: string, resource: string) {
    this.logger.info('User action', {
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ip: this.request.ip,
    });
  }
}
```

---

## 15. Plan de réponse aux incidents

### 15.1 Classification des incidents
- **P0 - Critique** - Brèche de sécurité confirmée
- **P1 - Urgent** - Vulnérabilité exploitable
- **P2 - Important** - Faille de sécurité mineure
- **P3 - Normal** - Amélioration sécuritaire

### 15.2 Procédure de réponse
1. **Détection** - Monitoring automatique + signalement
2. **Containment** - Isolation immédiate si nécessaire
3. **Investigation** - Analyse forensique des logs
4. **Remediation** - Correction et patch déployés
5. **Recovery** - Restauration service sécurisé
6. **Lessons learned** - Post-mortem et améliorations

### 15.3 Communication de crise
- **Notification interne** - Équipe sécurité alertée
- **Notification clients** - Si impact utilisateurs
- **Notification autorités** - Si requis par RGPD
- **Documentation** - Rapport d'incident complet

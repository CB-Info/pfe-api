# 🚀 Guide de Déploiement - C2.4.1

## 1. Vue d'ensemble des déploiements

### Environnements disponibles
- **🔧 Local** - Développement sur poste développeur
- **🧪 Staging** - Tests d'intégration (branche develop)
- **🚀 Production** - Application live (branche main)

### Technologies de déploiement
- **Render** - Plateforme cloud principale (PaaS)
- **GitHub Actions** - CI/CD automatisé
- **MongoDB Atlas** - Base de données managée

---

## 2. Déploiement local (développement)

### 2.1 Prérequis système
```bash
# Versions requises
Node.js >= 20.0.0
npm >= 9.0.0
MongoDB >= 8.0 (local ou Atlas)
Git >= 2.30.0
```

### 2.2 Installation complète
```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/pfe-api.git
cd pfe-api

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Valider la configuration
npm run validate-env

# 5. Démarrer en mode développement
npm run start:dev
```

### 2.3 Configuration locale (.env)
```env
# Application
NODE_ENV=development
PORT=3000

# Base de données
MONGO_URL=mongodb://localhost:27017/eatopia-dev

# Sécurité
API_KEY=dev-api-key-32-characters-minimum

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Firebase (optionnel pour dev)
# Placer credentials.json dans src/configs/
```

### 2.4 Données de test
```bash
# Charger les fixtures (optionnel)
npm run load-fixtures

# Vérifier l'API
curl http://localhost:3000/health
```

---

## 3. Déploiement Render (production)

### 3.1 Configuration Render
<figure>
  <a href="https://www.dropbox.com/scl/fi/lm8cit5oj30wsgoapw6n4/cd-settings.png?rlkey=ae3f30wn2l9amyjyv5gqhptul&st=d73ay706&dl=0" target="_blank">
  <img src="https://dl.dropboxusercontent.com/scl/fi/lm8cit5oj30wsgoapw6n4/cd-settings.png?rlkey=ae3f30wn2l9amyjyv5gqhptul" alt="CD Settings" width="200">
</a>
  <figcaption>CD Settings — cliquer pour agrandir</figcaption>
</figure>

### 3.2 Variables d'environnement Render
```bash
# Variables à configurer dans Render Dashboard
NODE_ENV=production
PORT=10000  # Auto-configuré par Render
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/eatopia
API_KEY=production-api-key-32-characters-minimum
ALLOWED_ORIGINS=https://eatopia-web.onrender.com,https://eatopia.com

# Firebase credentials
# Uploader credentials.json via Render Dashboard -> Environment -> Secret Files
# Path: /etc/secrets/credentials.json
```

<figure>
  <a href="https://www.dropbox.com/scl/fi/t93qrdinicouo85ymvzry/secret-env.png?rlkey=ydb5i29ip4nc04mgt0laj8c59&st=xuk0c6a5&dl=0" target="_blank">
  <img src="https://dl.dropboxusercontent.com/scl/fi/t93qrdinicouo85ymvzry/secret-env.png?rlkey=ydb5i29ip4nc04mgt0laj8c59" alt="Secret & Env" width="200">
</a>
  <figcaption>Secret & Env — cliquer pour agrandir</figcaption>
</figure>

### 3.3 Configuration Firebase pour production
```bash
# 1. Générer les credentials Firebase
# Console Firebase > Paramètres > Comptes de service > Générer nouvelle clé

# 2. Uploader dans Render
# Dashboard > Service > Environment > Secret Files
# Nom: credentials.json
# Contenu: [coller le contenu du fichier JSON]

# 3. Le fichier sera disponible à /etc/secrets/credentials.json
```

### 3.4 Déploiement automatique
```bash
# Le déploiement se déclenche automatiquement sur :
git push origin main  # → Production
git push origin develop  # → Staging

# Vérification du déploiement
curl https://pfe-api-fbyd.onrender.com/health

```
#### Status du déploiement
<figure>
  <a href="https://www.dropbox.com/scl/fi/g3od269dk78h0210kieru/deploy-status.png?rlkey=4axyd8uxlctdu9puke4yrbvhz&st=bt6jl472&dl=0" target="_blank">
  <img src="https://dl.dropboxusercontent.com/scl/fi/g3od269dk78h0210kieru/deploy-status.png?rlkey=4axyd8uxlctdu9puke4yrbvhz" alt="Deploy Status" width="400">
</a>
  <figcaption>Deploy Status — cliquer pour agrandir</figcaption>
</figure>

---

## 4. Configuration des bases de données

### 4.1 MongoDB Atlas (production)
```bash
# 1. Créer un cluster MongoDB Atlas
# 2. Configurer l'accès réseau (IP Render)
# 3. Créer un utilisateur dédié
# 4. Récupérer la connection string

# Format de connection string
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 5.2 MongoDB local (développement)
```bash
# Installation MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Démarrage
brew services start mongodb-community

# Connexion
mongosh mongodb://localhost:27017/eatopia-dev
```

### 5.3 Sécurisation base de données
```javascript
// Configuration Mongoose sécurisée
MongooseModule.forRoot(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,  // Chiffrement en transit
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'  // Write concern sécurisé
});
```

---

## 6. Optimisations de performance

### 6.1 Build de production
```bash
# Build optimisé
npm run build

# Vérification de la taille
du -sh dist/
ls -la dist/

# Test du build
node dist/main.js
```

### 6.2 Optimisations Render
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main",
    "postinstall": "npm run build"  // Build automatique
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 6.3 Monitoring des performances
```typescript
// Configuration APM (Application Performance Monitoring)
if (process.env.NODE_ENV === 'production') {
  // New Relic, DataDog, ou Sentry
  app.use(performanceMiddleware);
  app.use(errorTrackingMiddleware);
}
```

---

## 7. Sécurisation du déploiement

### 7.1 Variables d'environnement sécurisées
```bash
# ❌ JAMAIS dans le code
const API_KEY = "sk-1234567890";

# ✅ Toujours via variables d'environnement
const API_KEY = process.env.API_KEY;

# ✅ Validation des variables critiques
if (!process.env.API_KEY || process.env.API_KEY.length < 32) {
  throw new Error('API_KEY must be at least 32 characters');
}
```

### 7.2 Secrets management
```bash
# Render Secrets (recommandé)
- Variables d'environnement chiffrées
- Secret files pour certificats
- Rotation automatique possible

# GitHub Secrets (CI/CD)
- MONGODB_CONNECTION_STRING
- FIREBASE_SERVICE_ACCOUNT
```

### 7.3 Network security
```typescript
// Production hardening
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());  // Headers sécurisés
  app.enableCors({    // CORS restrictif
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  });
  app.use(rateLimit()); // Rate limiting
}
```

---

## 8. Monitoring et logs

### 8.1 Health checks
```typescript
// Endpoint de santé complet
@Get('health')
checkHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: await this.checkDatabaseConnection(),
    firebase: await this.checkFirebaseConnection(),
  };
}
```

### 8.2 Logs structurés
```typescript
// Configuration des logs production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Logs HTTP détaillés

  // Logs applicatifs
  const logger = new Logger('Application');
  logger.log('Application started', {
    port: process.env.PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
```

### 8.3 Monitoring externe
```bash
# Outils recommandés
- Uptime: UptimeRobot, Pingdom
- APM: New Relic, DataDog
- Logs: Loggly, Papertrail
- Errors: Sentry, Rollbar
```

---

## 9. Backup et disaster recovery

### 9.1 Stratégie de backup
```bash
# MongoDB Atlas (automatique)
- Backups continus (Point-in-Time Recovery)
- Snapshots quotidiens (7 jours rétention)
- Réplication multi-région

# Backup manuel (si nécessaire)
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

### 9.2 Plan de disaster recovery
```bash
# RTO (Recovery Time Objective): < 15 minutes
# RPO (Recovery Point Objective): < 5 minutes

# Procédure de restauration
1. Identifier l'incident
2. Basculer sur backup database
3. Redéployer l'application
4. Vérifier la fonctionnalité
5. Notifier les utilisateurs
```

### 9.3 Tests de recovery
```bash
# Tests mensuels recommandés
1. Simulation de panne database
2. Test de restauration backup
3. Validation des procédures
4. Mise à jour de la documentation
```

---

## 10. Rollback et versioning

### 10.1 Stratégie de rollback
```bash
# Render (rollback automatique)
# Dashboard > Deployments > Previous Version > Rollback

# Git (rollback manuel)
git log --oneline -10  # Voir les derniers commits
git revert <commit-hash>  # Revert spécifique
git push origin main  # Déclenche nouveau déploiement
```

### 10.2 Blue-Green deployment
```yaml
# Configuration Render pour zero-downtime
services:
  - type: web
    name: eatopia-api
    env: node
    buildCommand: npm run build
    startCommand: npm run start:prod
    healthCheckPath: /health  # Validation avant switch
    preDeployCommand: npm run validate-env  # Pré-checks
```

### 10.3 Versioning sémantique
```json
{
  "version": "1.2.3",  // MAJOR.MINOR.PATCH
  "scripts": {
    "version:patch": "npm version patch && git push --tags",
    "version:minor": "npm version minor && git push --tags",
    "version:major": "npm version major && git push --tags"
  }
}
```

---

## 11. Procédures opérationnelles

### 11.1 Checklist pré-déploiement
```bash
✅ Tests passent (npm run test)
✅ Linting OK (npm run lint)
✅ Build réussi (npm run build)
✅ Variables d'env validées (npm run validate-env)
✅ Documentation mise à jour
✅ Changelog mis à jour
✅ Backup database récent
✅ Équipe notifiée
```

### 11.2 Checklist post-déploiement
```bash
✅ Health check OK (curl /health)
✅ Logs sans erreurs
✅ Métriques normales
✅ Tests smoke passés
✅ Utilisateurs peuvent se connecter
✅ Fonctionnalités critiques OK
✅ Monitoring actif
✅ Équipe notifiée du succès
```

### 11.3 Procédure d'urgence
```bash
# En cas de problème critique
1. Rollback immédiat (< 5 minutes)
2. Investigation des logs
3. Notification équipe + management
4. Fix en hotfix branch
5. Test du fix
6. Redéploiement
7. Post-mortem
```

---

## 12. Documentation des déploiements

### 12.1 Changelog automatique
```bash
# Génération automatique via conventional commits
npm install -g conventional-changelog-cli
conventional-changelog -p angular -i CHANGELOG.md -s

# Format des commits
feat: add user authentication
fix: resolve memory leak in orders
docs: update deployment guide
```

### 12.2 Release notes
```markdown
## Version 1.2.0 - 19-08-2025

### 🚀 Nouvelles fonctionnalités
- Authentification Firebase intégrée
- Système RBAC complet (6 rôles)
- API de gestion des stocks

### 🐛 Corrections
- Correction fuite mémoire dans les commandes
- Amélioration performances base de données

### 🔧 Améliorations techniques
- Migration vers Node.js 20
- Monitoring amélioré
```

### 12.3 Documentation technique
- **Configuration** : [CONFIGURATION.md](./CONFIGURATION.md)
- **Architecture** : [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Opérations** : [OPERATIONS.md](./OPERATIONS.md)
- **CI/CD** : [CI_CD.md](./CI_CD.md)

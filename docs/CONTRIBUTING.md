# 🤝 Guide de Contribution - C2.2.3

## 1. Vue d'ensemble

### Objectif
Ce guide définit les **standards de développement** et les **procédures de contribution** pour maintenir la qualité et la cohérence du projet Eatopia API.

### Principes fondamentaux
- **Qualité avant vitesse** - Code propre et testé
- **Sécurité by design** - Sécurité intégrée dès la conception
- **Documentation vivante** - Documentation maintenue avec le code
- **Collaboration transparente** - Processus ouverts et tracés

---

## 2. Conventions de commit

### 2.1 Format Conventional Commits
```bash
# Structure obligatoire
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 2.2 Types de commits
| Type | Description | Exemple |
|------|-------------|---------|
| **feat** | Nouvelle fonctionnalité | `feat(auth): add Firebase authentication` |
| **fix** | Correction de bug | `fix(orders): resolve memory leak in order processing` |
| **docs** | Documentation uniquement | `docs(api): update RBAC documentation` |
| **style** | Formatage, style (pas de changement logique) | `style(user): format code with prettier` |
| **refactor** | Refactoring sans changement fonctionnel | `refactor(dish): extract validation logic` |
| **test** | Ajout ou modification de tests | `test(user): add integration tests for role changes` |
| **chore** | Maintenance, configuration | `chore(deps): update dependencies to latest` |
| **perf** | Amélioration de performance | `perf(db): optimize user queries with indexes` |
| **ci** | Configuration CI/CD | `ci(github): add security audit workflow` |
| **build** | Build, bundling, packaging | `build(docker): optimize production image size` |

### 2.3 Scopes recommandés
```bash
# Modules métier
auth, user, dish, order, card, stock, ingredient, table

# Infrastructure
db, mongo, firebase, config, security, deploy

# Outils
test, docs, ci, build, lint
```

### 2.4 Exemples de commits valides
```bash
✅ feat(auth): implement Firebase JWT token validation
✅ fix(orders): prevent duplicate order creation
✅ docs(rbac): add permission matrix for all roles
✅ test(dish): increase coverage to 95% with edge cases
✅ refactor(user): extract role validation to separate service
✅ chore(deps): update @nestjs/core to v10.3.0
✅ ci(deploy): add staging environment for develop branch
```

---

## 3. Workflow de développement

### 3.1 Branching strategy
```bash
# Structure des branches
main              # 🚀 Production - Code stable uniquement
develop           # 🧪 Staging - Intégration des features
feature/xxx       # 🔧 Développement - Nouvelles fonctionnalités
hotfix/xxx        # 🚨 Urgence - Corrections critiques
release/vx.x.x    # 📦 Release - Préparation des versions
```

### 3.2 Création d'une feature
```bash
# 1. Partir de develop
git checkout develop
git pull origin develop

# 2. Créer la branche feature
git checkout -b feature/user-role-management

# 3. Développer avec commits atomiques
git add .
git commit -m "feat(user): add role change validation"

# 4. Tests et validation
npm run test
npm run lint
npm run build

# 5. Push et création PR
git push origin feature/user-role-management
# Créer PR via GitHub UI
```

### 3.3 Merge et déploiement
```bash
# 1. Review obligatoire par 2+ développeurs
# 2. Validation automatique (CI/CD)
# 3. Merge vers develop → Déploiement staging
# 4. Tests d'intégration sur staging
# 5. Merge develop → main → Déploiement production
```

---

## 4. Standards de code

### 4.1 Style et formatage
```typescript
// Configuration ESLint + Prettier obligatoire
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-console": "warn"  // Sauf pour scripts
  }
}
```

### 4.2 Conventions de nommage
```typescript
// Classes - PascalCase
export class UserService { }
export class OrderController { }

// Fichiers - kebab-case
user.service.ts
order.controller.spec.ts
global-exception.filter.ts

// Variables/fonctions - camelCase
const userId = '123';
async function createUser() { }

// Constants - SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// Enums - PascalCase
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}
```

### 4.3 Documentation du code
```typescript
// JSDoc obligatoire pour fonctions publiques
/**
 * Creates a new user in the system with Firebase authentication
 * @param userData - User data validated by UserDTO
 * @returns Promise resolving to created user
 * @throws BadRequestException if email already exists
 * @throws InternalServerErrorException if Firebase creation fails
 */
async createUser(userData: UserDTO): Promise<User> {
  // Implementation...
}

// Commentaires pour logique complexe
// RBAC: Only admin can create owner accounts (business rule #BR-001)
if (userData.role === UserRole.OWNER && !this.isAdmin(currentUser)) {
  throw new ForbiddenException('Insufficient privileges to create owner');
}
```

---

## 5. Règles de Pull Request

### 5.1 Template de PR obligatoire
```markdown
## 📋 Description
Brief description of changes

## 🎯 Type de changement
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update

## 🧪 Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration validés
- [ ] Couverture maintenue/améliorée
- [ ] Tests manuels effectués

## 🔒 Sécurité
- [ ] Pas de secrets exposés
- [ ] Validation des entrées implémentée
- [ ] Autorisations RBAC vérifiées
- [ ] Audit de sécurité passé

## 📚 Documentation
- [ ] Documentation technique mise à jour
- [ ] Swagger/OpenAPI mis à jour
- [ ] README mis à jour si nécessaire
- [ ] CHANGELOG mis à jour
```

### 5.2 Critères d'acceptation
```bash
✅ CI/CD pipeline passe (tous les checks verts)
✅ Review approuvée par 2+ développeurs
✅ Tests de régression passés
✅ Documentation mise à jour
✅ Pas de conflits avec la branche cible
✅ Commit messages respectent les conventions
✅ Couverture de tests maintenue (> 75%)
✅ Pas de vulnérabilités introduites
```

### 5.3 Processus de review
```bash
# Checklist pour reviewers
□ Code lisible et maintenable
□ Tests appropriés et suffisants
□ Sécurité respectée (auth, validation, RBAC)
□ Performance acceptable (pas de régression)
□ Documentation cohérente
□ Respect des conventions du projet
□ Pas d'impact sur les autres modules
□ Migration/breaking changes documentés
```

---

## 6. Standards de tests

### 6.1 Couverture obligatoire
```typescript
// Couverture minimale par type de fichier
Controllers:  > 90%  // Tests d'API critiques
Services:     > 85%  // Logique métier essentielle
Guards:       > 95%  // Sécurité critique
Utils:        > 90%  // Fonctions partagées
Repositories: > 80%  // Accès données
```

### 6.2 Types de tests requis
```typescript
// Pour chaque nouveau service
describe('NewService', () => {
  // Tests de succès
  describe('Happy path', () => {
    it('should create entity successfully', () => { });
    it('should find entity by id', () => { });
    it('should update entity', () => { });
  });

  // Tests d'erreur
  describe('Error handling', () => {
    it('should throw NotFoundException for invalid id', () => { });
    it('should throw ValidationException for invalid data', () => { });
    it('should handle database errors gracefully', () => { });
  });

  // Tests de sécurité (si applicable)
  describe('Security', () => {
    it('should respect RBAC permissions', () => { });
    it('should validate user ownership', () => { });
  });
});
```

### 6.3 Mocking guidelines
```typescript
// Règles de mocking
1. Mocker toutes les dépendances externes (DB, APIs)
2. Utiliser des données réalistes (Faker.js)
3. Tester les cas d'erreur des dépendances
4. Vérifier les appels aux dépendances mockées

// Exemple de mock correct
const mockUserRepository = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();  // Reset entre chaque test
});
```

---

## 7. Sécurité et bonnes pratiques

### 7.1 Checklist sécurité
```typescript
// Avant chaque commit
✅ Pas de secrets hardcodés (API keys, passwords)
✅ Variables sensibles via process.env uniquement
✅ Validation des entrées avec class-validator
✅ Authentification sur endpoints sensibles
✅ Autorisation RBAC appropriée
✅ Logs sans données sensibles
✅ Gestion d'erreurs sans fuite d'information
✅ Tests de sécurité inclus
```

### 7.2 Gestion des secrets
```bash
# ❌ JAMAIS dans le code
const API_KEY = "sk-1234567890abcdef";
const MONGO_URL = "mongodb://user:password@host/db";

# ✅ Toujours via variables d'environnement
const API_KEY = process.env.API_KEY;
const MONGO_URL = process.env.MONGO_URL;

# ✅ Validation des secrets
if (!API_KEY || API_KEY.length < 32) {
  throw new Error('API_KEY must be at least 32 characters');
}
```

### 7.3 Audit de code
```bash
# Commandes d'audit obligatoires avant PR
npm audit                    # Vulnérabilités des dépendances
npm run lint:security       # Règles de sécurité ESLint
npm run test                 # Tests de sécurité inclus

# Outils recommandés
- SonarQube: Analyse statique complète
- Snyk: Scan des vulnérabilités
- OWASP ZAP: Tests de pénétration
```

---

## 8. Processus de release

### 8.1 Préparation de release
```bash
# 1. Créer branche release
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Mise à jour version
npm version minor  # ou patch/major selon les changements

# 3. Mise à jour CHANGELOG
# Ajouter les nouvelles fonctionnalités et corrections

# 4. Tests complets
npm run test:cov
npm run test:e2e
npm run lint

# 5. Build de validation
npm run build
```

### 8.2 Déploiement release
```bash
# 1. Merge vers main
git checkout main
git merge release/v1.2.0 --no-ff

# 2. Tag de version
git tag -a v1.2.0 -m "Release version 1.2.0"

# 3. Push avec tags
git push origin main --tags

# 4. Déploiement automatique via CI/CD
# GitHub Actions détecte le push sur main

# 5. Validation production
curl https://eatopia-api.onrender.com/health
```

### 8.3 Communication de release
```markdown
# Annonce dans #releases Slack
🚀 **Release v1.2.0 déployée en production**

**Nouvelles fonctionnalités:**
- Authentification Firebase intégrée
- Système RBAC complet (6 rôles)
- API de gestion des stocks

**Corrections:**
- Résolution fuite mémoire commandes
- Amélioration performances DB

**Migration requise:** Aucune
**Downtime:** 0 minute
**Rollback:** Disponible si nécessaire
```

---

## 9. Environnements de développement

### 9.1 Configuration locale
```bash
# Setup initial développeur
1. git clone https://github.com/org/eatopia-api.git
2. cd eatopia-api
3. npm install
4. cp .env.example .env
5. # Éditer .env avec valeurs locales
6. npm run validate-env
7. npm run start:dev
```

### 9.2 Outils obligatoires
```json
{
  "required": [
    "Node.js >= 20.0.0",
    "npm >= 9.0.0",
    "Git >= 2.30.0",
    "VS Code ou IDE équivalent"
  ],
  "recommended": [
    "MongoDB Compass",
    "Postman ou Insomnia",
    "Docker Desktop",
    "GitHub CLI"
  ]
}
```

### 9.3 Extensions VS Code recommandées
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "mongodb.mongodb-vscode"
  ]
}
```

---

## 10. Checklist qualité

### 10.1 Avant chaque commit
```bash
✅ Code formaté avec Prettier
✅ Pas d'erreurs ESLint
✅ Tests unitaires ajoutés/mis à jour
✅ Tests passent localement
✅ Build réussi
✅ Documentation mise à jour
✅ Pas de console.log oubliés
✅ Variables d'environnement validées
```

### 10.2 Avant chaque PR
```bash
✅ Branche à jour avec develop
✅ Commits squashés si nécessaire
✅ Description PR complète
✅ Screenshots/vidéos si UI
✅ Tests d'intégration validés
✅ Performance non dégradée
✅ Sécurité vérifiée
✅ Documentation technique mise à jour
```

### 10.3 Avant chaque release
```bash
✅ Tous les tests passent (416/416)
✅ Couverture > 75%
✅ Audit sécurité clean
✅ Performance benchmarks OK
✅ Documentation synchronisée
✅ CHANGELOG mis à jour
✅ Migration scripts testés
✅ Rollback plan validé
```

---

## 11. Gestion des dépendances

### 11.1 Politique de mise à jour
```bash
# Mise à jour automatique (Dependabot)
- Patches de sécurité: Automatique
- Mises à jour mineures: Review requise
- Mises à jour majeures: Planning et tests étendus

# Audit régulier
npm audit                    # Hebdomadaire
npm outdated                 # Mensuel
npm ls --depth=0            # Vérification structure
```

### 11.2 Ajout de nouvelles dépendances
```bash
# Procédure d'évaluation
1. Justification métier claire
2. Analyse des alternatives
3. Vérification sécuritaire (npm audit)
4. Test d'impact sur bundle size
5. Documentation de l'usage
6. Approbation équipe technique
```

### 11.3 Suppression de dépendances
```bash
# Procédure de nettoyage
1. Identifier dépendances inutilisées: npm ls --depth=0
2. Vérifier absence d'usage: grep -r "package-name" src/
3. Supprimer: npm uninstall package-name
4. Tests complets: npm run test
5. Commit: chore(deps): remove unused package-name
```

---

## 12. Debugging et troubleshooting

### 12.1 Debug local
```bash
# Mode debug avec breakpoints
npm run start:debug

# Variables d'environnement debug
DEBUG=eatopia:* npm run start:dev
LOG_LEVEL=debug npm run start:dev

# Tests en mode debug
npm run test:debug
```

### 12.2 Analyse des performances
```bash
# Profiling Node.js
node --prof dist/main.js
node --prof-process isolate-*.log > profile.txt

# Monitoring mémoire
node --inspect dist/main.js
# Chrome DevTools > Memory tab
```

### 12.3 Diagnostic base de données
```bash
# Connexion MongoDB
mongosh "mongodb+srv://..."

# Requêtes de diagnostic
db.users.countDocuments()
db.orders.find().limit(5)
db.dishes.getIndexes()

# Performance des requêtes
db.orders.explain("executionStats").find({status: "pending"})
```

---

## 13. Documentation technique

### 13.1 Documentation obligatoire
```typescript
// Pour chaque nouveau module
README.md section          # Description + liens
API documentation         # Swagger/OpenAPI auto-générée
RBAC permissions         # Matrice des autorisations
Tests documentation      # Scénarios et couverture
Security considerations  # Aspects sécuritaires
```

### 13.2 Maintenance de la documentation
```bash
# Synchronisation documentation/code
1. Documentation mise à jour avec chaque PR
2. Review de cohérence mensuelle
3. Validation par utilisateurs trimestrielle
4. Archivage des versions obsolètes
```

### 13.3 Formats standardisés
```markdown
# Structure Markdown standardisée
# Titre H1 - Nom du document
## Section H2 - Grandes parties
### Sous-section H3 - Détails
#### H4 - Exemples/cas spécifiques

# Blocs de code avec langage
```typescript
code example
```

# Tables pour données structurées
| Colonne 1 | Colonne 2 | Statut |
|-----------|-----------|---------|
| Valeur    | Valeur    | ✅      |
```

---

## 14. Formation et onboarding

### 14.1 Checklist nouveau développeur
```bash
□ Accès repository GitHub configuré
□ Environnement local fonctionnel
□ Tests passent en local
□ Documentation lue et comprise
□ Standards de code maîtrisés
□ Premier commit avec mentor
□ Review de code effectuée
□ Procédures d'urgence comprises
```

### 14.2 Ressources de formation
```bash
# Documentation technique
- NestJS Documentation: https://docs.nestjs.com
- MongoDB Documentation: https://docs.mongodb.com
- Firebase Documentation: https://firebase.google.com/docs
- Jest Documentation: https://jestjs.io/docs

# Standards du projet
- Architecture: docs/ARCHITECTURE.md
- Sécurité: docs/SECURITY.md
- Tests: docs/TEST_STRATEGY.md
- Déploiement: docs/DEPLOYMENT.md
```

### 14.3 Mentoring
```bash
# Programme d'accompagnement
Semaine 1: Setup + première feature simple
Semaine 2: Feature complexe avec tests
Semaine 3: Review de code et best practices
Semaine 4: Autonomie avec support disponible
```

---

## 15. Amélioration continue

### 15.1 Rétrospectives techniques
```bash
# Rétrospectives mensuelles
- Analyse des métriques de qualité
- Feedback sur les processus
- Identification des points d'amélioration
- Mise à jour des standards si nécessaire
```

### 15.2 Veille technologique
```bash
# Sources de veille
- NestJS releases et roadmap
- MongoDB nouvelles fonctionnalités
- Firebase updates et deprecations
- Sécurité: CVE et advisories
- Performance: nouvelles optimisations
```

### 15.3 Innovation et expérimentation
```bash
# Spike branches pour expérimentation
spike/graphql-api           # Test GraphQL vs REST
spike/microservices         # Architecture distribuée
spike/event-sourcing        # Audit trail complet
spike/realtime-websockets   # Notifications temps réel
```

---

**Document Contribution C2.2.3** - Eatopia API
*Rédigé le : Août 2025*
*Version : 1.0*
*Prochaine mise à jour : Après évolution des processus de développement*

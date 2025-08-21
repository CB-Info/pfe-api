# 🧪 Stratégie de Tests - C2.2.2

## 1. Vue d'ensemble de la stratégie

### Objectifs
- **Qualité logicielle** : Garantir la fiabilité et la robustesse de l'API Eatopia
- **Couverture complète** : Tester tous les composants critiques (controllers, services, guards)
- **Automatisation** : Intégration continue avec validation automatique
- **Documentation** : Preuves de conformité pour validation RNCP

### Philosophie
Approche **Test-Driven Development (TDD)** avec focus sur :
- **Fonctionnalité** avant performance
- **Sécurité** avant optimisation
- **Robustesse** avant nouvelles features

---

## 2. Pyramide des tests

```
                    🔺
                   /   \
                  / E2E \     ← Tests End-to-End (API complète)
                 /       \
                /_________\
               /           \
              / INTEGRATION \  ← Tests d'intégration (modules)
             /               \
            /_________________\
           /                   \
          /      UNITAIRES      \ ← Tests unitaires (fonctions)
         /                       \
        /_________________________\
```

### 2.1 Tests unitaires (Base - 80%)
- **Scope** : Fonctions, méthodes, classes isolées
- **Outils** : Jest + mocking
- **Cible** : 90%+ de couverture
- **Vitesse** : < 5s pour 400+ tests

### 2.2 Tests d'intégration (Milieu - 15%)
- **Scope** : Interaction entre modules
- **Outils** : Jest + MongoDB Memory Server
- **Cible** : Workflows complets
- **Focus** : API + Base de données

### 2.3 Tests E2E (Sommet - 5%)
- **Scope** : Scénarios utilisateur complets
- **Outils** : Supertest + API réelle
- **Cible** : Parcours critiques
- **Focus** : Authentification + RBAC

---

## 3. Outils et technologies

### 3.1 Framework principal
```json
{
  "framework": "Jest",
  "version": "^29.5.0",
  "runner": "ts-jest",
  "environment": "node"
}
```

### 3.2 Outils complémentaires
- **@nestjs/testing** : Module de test NestJS
- **Supertest** : Tests HTTP/API
- **MongoDB Memory Server** : Base de données en mémoire
- **jest-json-reporter** : Rapports JSON pour CI/CD

### 3.3 Mocking et simulation
- **jest.fn()** : Fonctions mockées
- **jest.spyOn()** : Espionnage de méthodes
- **jest.mock()** : Modules mockés complets
- **Faker.js** : Génération de données de test

---

## 4. Structure des tests

### 4.1 Organisation des fichiers
```
src/
├── modules/
│   ├── user/
│   │   ├── user.controller.spec.ts    # Tests API
│   │   ├── user.service.spec.ts       # Tests logique métier
│   │   └── user.module.ts
│   └── .../
├── guards/
│   ├── roles.guard.spec.ts            # Tests sécurité
│   └── simple.guard.spec.ts
├── utils/
│   ├── response.spec.ts               # Tests utilitaires
│   └── date.beautifier.spec.ts
└── test/
    ├── jest-e2e.json                  # Config E2E
    └── a.spec.ts                      # Tests globaux
```

### 4.2 Convention de nommage
- **Fichiers** : `*.spec.ts` pour tous les tests
- **Describe blocks** : Nom de la classe/module testé
- **Test cases** : Description claire de l'action testée
- **Variables** : Prefixe `mock` pour les objets simulés

### 4.3 Pattern AAA (Arrange-Act-Assert)
```typescript
describe('UserService', () => {
  it('should create a user successfully', async () => {
    // Arrange - Préparation
    const userData = { email: 'test@example.com', ... };
    mockRepository.create.mockResolvedValue(expectedUser);

    // Act - Action
    const result = await service.createUser(userData);

    // Assert - Vérification
    expect(result).toEqual(expectedUser);
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
  });
});
```

---

## 5. Couverture et métriques

### 5.1 Objectifs de couverture
| Type | Objectif | Actuel | Statut |
|------|----------|---------|---------|
| **Lignes** | 80% | 71.9% | 🟡 Proche |
| **Fonctions** | 80% | 68.5% | 🟡 Proche |
| **Branches** | 70% | 57.07% | 🟡 Proche |
| **Statements** | 80% | 71.9% | 🟡 Proche |

### 5.2 Modules critiques (90%+ requis)
- ✅ **Guards** : Sécurité RBAC
- ✅ **User Service** : Gestion utilisateurs
- ✅ **Auth Controllers** : Authentification
- ✅ **Utils** : Fonctions critiques

### 5.3 Métriques qualité
```bash
# Commande de génération du rapport
npm run test:cov

# Résultats attendus
Test Suites: 22 passed, 22 total
Tests:       416 passed, 416 total
Coverage:    71.9% lines, 57.07% branches
Time:        < 6 seconds
```

---

## 6. Types de tests par composant

### 6.1 Controllers (Tests API)
**Objectif** : Valider les endpoints HTTP
```typescript
describe('UserController', () => {
  // Tests de succès
  it('should login user with valid credentials', async () => { ... });

  // Tests d'erreur
  it('should return 401 for invalid credentials', async () => { ... });

  // Tests de validation
  it('should validate email format', async () => { ... });

  // Tests RBAC
  it('should deny access for insufficient role', async () => { ... });
});
```

### 6.2 Services (Tests logique métier)
**Objectif** : Valider la logique applicative
```typescript
describe('UserService', () => {
  // Tests CRUD
  it('should create user in database', async () => { ... });

  // Tests de validation
  it('should throw error for duplicate email', async () => { ... });

  // Tests de permissions
  it('should check role hierarchy correctly', async () => { ... });
});
```

### 6.3 Guards (Tests sécurité)
**Objectif** : Valider les contrôles d'accès
```typescript
describe('RolesGuard', () => {
  // Tests d'autorisation
  it('should allow access for valid role', async () => { ... });

  // Tests de refus
  it('should deny access for invalid role', async () => { ... });

  // Tests edge cases
  it('should handle missing roles decorator', async () => { ... });
});
```

### 6.4 Repositories (Tests données)
**Objectif** : Valider l'accès aux données
```typescript
describe('UserRepository', () => {
  // Tests de persistance
  it('should save user to database', async () => { ... });

  // Tests de requêtes
  it('should find user by email', async () => { ... });

  // Tests d'erreur
  it('should handle database connection failure', async () => { ... });
});
```

---

## 7. Stratégies de mocking

### 7.1 Database Mocking
```typescript
// Mock du repository MongoDB
const mockRepository = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

### 7.2 External Services Mocking
```typescript
// Mock Firebase Auth
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  }),
}));
```

### 7.3 HTTP Requests Mocking
```typescript
// Mock des requêtes avec Supertest
const app = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

const request = supertest(app.getHttpServer());
```

---

## 8. Gestion des données de test

### 8.1 Fixtures et Factory
```typescript
// Factory pour générer des données cohérentes
export const UserFactory = {
  create: (overrides = {}) => ({
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: UserRole.CUSTOMER,
    ...overrides,
  }),
};
```

### 8.2 Test Database
- **MongoDB Memory Server** pour tests d'intégration
- **Isolation complète** entre les tests
- **Cleanup automatique** après chaque test

### 8.3 Données réalistes
```typescript
// Utilisation de Faker pour des données variées
import { faker } from '@faker-js/faker';

const generateTestUser = () => ({
  email: faker.internet.email(),
  firstname: faker.person.firstName(),
  lastname: faker.person.lastName(),
});
```

---

## 9. Règles et bonnes pratiques

### 9.1 Règles de qualité
- **Un test = un comportement** : Tests atomiques et focalisés
- **Indépendance** : Aucune dépendance entre tests
- **Déterminisme** : Résultats reproductibles
- **Lisibilité** : Tests auto-documentés

### 9.2 Gestion des erreurs
- **Tous les cas d'erreur testés** : 400, 401, 403, 404, 500
- **Messages d'erreur validés** : Contenu et format
- **Exceptions métier couvertes** : Validation, business rules

### 9.3 Performance des tests
- **Temps d'exécution** : < 6 secondes pour la suite complète
- **Parallélisation** : Tests indépendants exécutés en parallèle
- **Mocking agressif** : Pas d'I/O réelles sauf tests d'intégration

---

## 10. Commandes et workflows

### 10.1 Commandes principales
```bash
# Tests unitaires complets
npm run test

# Tests avec couverture
npm run test:cov

# Tests en mode watch (développement)
npm run test:watch

# Tests E2E
npm run test:e2e

# Tests en mode debug
npm run test:debug
```

### 10.2 Configuration Jest
```json
{
  "testRegex": ".*\\.spec\\.ts$",
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/$1"
  }
}
```

### 10.3 Intégration CI/CD
- **Déclenchement** : Sur chaque push/PR
- **Validation** : Tests + couverture + linting
- **Rapport** : Résultats publiés dans GitHub Actions
- **Blocage** : Déploiement impossible si tests échouent

---

## 11. Monitoring et reporting

### 11.1 Métriques de suivi
- **Nombre de tests** : 416 actuellement
- **Temps d'exécution** : Suivi de la régression
- **Couverture par module** : Identification des gaps
- **Taux de réussite** : 100% requis pour déploiement

### 11.2 Rapports automatisés
- **Coverage HTML** : `coverage/lcov-report/index.html`
- **JSON Reporter** : Pour intégration avec outils externes
- **Console Output** : Résumé immédiat après exécution

### 11.3 Alerting
- **Échec de tests** : Notification immédiate équipe
- **Baisse de couverture** : Alert si < 75%
- **Performance** : Alert si > 10 secondes d'exécution

---

## 12. Évolution et maintenance

### 12.1 Ajout de nouveaux tests
- **Systématique** : Chaque nouveau feature = nouveaux tests
- **TDD encouragé** : Tests avant implémentation
- **Review obligatoire** : Validation par les pairs

### 12.2 Maintenance des tests existants
- **Refactoring** : Tests mis à jour avec le code
- **Suppression** : Tests obsolètes supprimés
- **Optimisation** : Performance des tests surveillée

### 12.3 Formation équipe
- **Standards** : Documentation des bonnes pratiques
- **Outils** : Formation sur Jest et NestJS Testing
- **Code Review** : Focus sur la qualité des tests

# 🔐 Contrôle d'Accès Basé sur les Rôles (RBAC) - C2.2.3

## 1. Vue d'ensemble du système RBAC

### Objectif
Le système RBAC (Role-Based Access Control) de l'API Eatopia implémente une **hiérarchie de 6 rôles** permettant un contrôle granulaire des accès aux ressources selon les responsabilités métier dans un restaurant.

### Architecture technique
- **Guards** : `FirebaseTokenGuard` + `RolesGuard`
- **Décorateurs** : `@Roles()` pour définir les rôles autorisés
- **Middleware** : Vérification automatique sur chaque endpoint protégé
- **Source** : `src/guards/roles.guard.ts` + `src/guards/roles.decorator.ts`

---

## 2. Hiérarchie des rôles

| Niveau | Rôle | Description | Permissions héritées |
|--------|------|-------------|---------------------|
| **6** | `ADMIN` | Administrateur système | Toutes les permissions |
| **5** | `OWNER` | Propriétaire du restaurant | Supervision complète sauf admin |
| **4** | `MANAGER` | Manager opérationnel | Gestion équipe + opérations |
| **3** | `KITCHEN_STAFF` | Personnel de cuisine | Préparation des commandes |
| **2** | `WAITER` | Serveur | Prise de commandes + service |
| **1** | `CUSTOMER` | Client | Consultation + commandes |

### Principe d'héritage
Les rôles supérieurs héritent automatiquement des permissions des rôles inférieurs, sauf restrictions explicites.

---

## 3. Matrice des permissions

### 🍽️ **Ressource : DISHES (Plats)**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/dishes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/dishes/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/dishes` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **PUT** `/dishes/:id` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **DELETE** `/dishes/:id` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

### 📋 **Ressource : CARDS (Menus)**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/cards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/cards/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/cards` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **PUT** `/cards/:id` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **PATCH** `/cards/:id/dishes/:dishId` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **DELETE** `/cards/:id/dishes/:dishId` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **DELETE** `/cards/:id` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 🛒 **Ressource : ORDERS (Commandes)**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/orders` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/orders/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/orders` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PUT** `/orders/:id` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DELETE** `/orders/:id` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 🥬 **Ressource : INGREDIENTS**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/ingredients` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/ingredients/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/ingredients` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PUT** `/ingredients/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DELETE** `/ingredients/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 📦 **Ressource : STOCKS**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/stocks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/stocks/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/stocks` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **PUT** `/stocks/:id` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **DELETE** `/stocks/:id` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

### 🪑 **Ressource : TABLES**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **GET** `/tables` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/tables/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/tables` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PUT** `/tables/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DELETE** `/tables/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 👥 **Ressource : USERS (Gestion utilisateurs)**

| Action | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|--------|----------|---------|---------------|---------|-------|-------|
| **POST** `/users/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST** `/users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/users/me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GET** `/users` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **GET** `/users/:id` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| **PATCH** `/users/:id` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| **PUT** `/users/:id/role` | ❌ | ❌ | ❌ | ✅* | ✅* | ✅ |
| **PUT** `/users/:id/deactivate` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **PUT** `/users/:id/activate` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **DELETE** `/users/:id` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Légende** :
- ✅ Accès autorisé
- ❌ Accès refusé (403 Forbidden)
- 🔒 Accès conditionnel (propre profil uniquement)
- ✅* Restrictions selon hiérarchie

---

## 4. Règles métier spécifiques

### 4.1 Gestion des rôles utilisateurs

#### **Restrictions hiérarchiques**
- **MANAGER** : Peut changer les rôles jusqu'à KITCHEN_STAFF inclus
- **OWNER** : Peut changer tous les rôles sauf ADMIN et son propre rôle
- **ADMIN** : Peut tout faire, y compris créer d'autres ADMIN

#### **Auto-modification**
- Aucun utilisateur ne peut modifier son propre rôle
- Exception : ADMIN peut se rétrograder (avec confirmation)

### 4.2 Permissions contextuelles

#### **Profil utilisateur**
```typescript
// Règle : Accès à son propre profil OU permissions management
if (request.user._id === userId || canManageUsers(request.user.role)) {
  // Autoriser l'accès
}
```

#### **Suppression définitive**
- Seuls les ADMIN peuvent supprimer définitivement un utilisateur
- Suppression simultanée MongoDB + Firebase Auth
- Action irréversible avec logs d'audit

### 4.3 Permissions opérationnelles

| Permission | CUSTOMER | WAITER | KITCHEN_STAFF | MANAGER | OWNER | ADMIN |
|------------|----------|---------|---------------|---------|-------|-------|
| `canManageUsers` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `canChangeRoles` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `canDeleteUsers` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `canCreateOwners` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `canManageOrders` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `canTakeOrders` | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `canPrepareOrders` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `canSuperviseRestaurant` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 5. Implémentation technique

### 5.1 Architecture des Guards

```typescript
// src/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}
```

### 5.2 Usage des décorateurs

```typescript
// Exemple d'endpoint protégé
@Post('dishes')
@UseGuards(FirebaseTokenGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.KITCHEN_STAFF, UserRole.OWNER, UserRole.ADMIN)
@ApiSecurity('Bearer')
async createDish(@Body() dishData: DishDTO) {
  // Logique métier
}
```

### 5.3 Vérification des permissions

```typescript
// src/modules/user/user.service.ts
canManageUsers = (userRole: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER].includes(userRole);
};

canDeleteUsers = (userRole: UserRole): boolean => {
  return userRole === UserRole.ADMIN;
};
```

---

## 6. Sécurité et validation

### 6.1 Authentification préalable
- Tous les endpoints protégés requièrent un **token Firebase valide**
- Vérification automatique via `FirebaseTokenGuard`
- Token injecté dans `request.user` pour vérifications ultérieures

### 6.2 Gestion des erreurs
```http
# Accès refusé par rôle insuffisant
HTTP/1.1 403 Forbidden
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 6.3 Logs de sécurité
- Tentatives d'accès non autorisées loggées
- Changements de rôles tracés avec timestamp
- Suppressions d'utilisateurs auditées

---

## 7. Tests et validation

### 7.1 Tests unitaires
- **Coverage** : 100% des guards et décorateurs
- **Scénarios** : Tous les rôles × toutes les permissions
- **Edge cases** : Tokens expirés, rôles invalides

### 7.2 Tests d'intégration
- Validation end-to-end des permissions
- Tests avec comptes réels par rôle
- Vérification des réponses HTTP appropriées

### 7.3 Validation manuelle
- **Endpoint** : `GET /users/permissions/check`
- **Réponse** : Permissions détaillées par rôle
- **Usage** : Debugging et validation frontend

---

## 8. Documentation technique

### 8.1 Sources de référence
- **Guards** : `src/guards/roles.guard.ts`
- **Décorateurs** : `src/guards/roles.decorator.ts`
- **Services** : `src/modules/user/user.service.ts`
- **Tests** : `src/guards/roles.guard.spec.ts`

### 8.2 Documentation API
- **Swagger** : `http://localhost:3000/api`
- **Authentification** : Bearer Token dans header Authorization
- **Exemple complet** : Voir [API_REFERENCE_RBAC.md](./API_REFERENCE_RBAC.md)

### 8.3 Validation des permissions
```bash
# Test des permissions pour un utilisateur connecté
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/users/permissions/check
```

---

**Document RBAC C2.2.3** - Eatopia API
*Rédigé le : Août 2025*
*Version : 1.0*
*Prochaine révision : Avant chaque évolution des rôles*

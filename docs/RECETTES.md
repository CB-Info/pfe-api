# 🧪 Cahier de Recettes - Eatopia API (C2.3.1)

## 1. Objectif et périmètre

### Objectif du document
Ce cahier de recettes constitue le **document de validation fonctionnelle** (C2.3.1) de l'API Eatopia. Il définit les scénarios de test pour valider le bon fonctionnement de chaque fonctionnalité avant mise en production.

### Périmètre de validation
- **API REST complète** - Tous les endpoints de l'ERP restaurant
- **Système d'authentification** - Firebase Auth + JWT tokens
- **Gestion des rôles RBAC** - 6 niveaux hiérarchiques
- **Modules métier** - Cards, Dishes, Ingredients, Orders, Stock, Tables, Users
- **Sécurité applicative** - Validation, autorisation, gestion d'erreurs

### Critères de recette
✅ **Fonctionnel** - Toutes les fonctionnalités répondent aux spécifications
✅ **Sécurisé** - Authentification et autorisations respectées
✅ **Robuste** - Gestion d'erreurs et cas limites maîtrisés
✅ **Performant** - Temps de réponse < 2s pour les requêtes simples

---

## 2. Prérequis techniques

### Environnement de test
- **Base URL** : `http://localhost:3000`
- **Documentation** : `http://localhost:3000/api` (Swagger)
- **Base de données** : MongoDB avec données de test
- **Authentification** : Firebase configuré avec comptes de test

### Données de référence (Fixtures)
```bash
# Charger les données de test
npm run load-fixtures
```

**Contenu généré** :
- 20 ingrédients avec noms aléatoires
- 10 plats avec ingrédients, prix, descriptions
- Catégories : STARTERS, MAIN_DISHES, DESSERTS, etc.

### Comptes utilisateurs de test

| Rôle | Email | Password | Permissions |
|------|-------|----------|-------------|
| **ADMIN** | admin@eatopia.com | AdminPass123! | Accès complet système |
| **OWNER** | owner@eatopia.com | OwnerPass123! | Supervision restaurant |
| **MANAGER** | manager@eatopia.com | ManagerPass123! | Gestion opérationnelle |
| **KITCHEN_STAFF** | chef@eatopia.com | ChefPass123! | Préparation commandes |
| **WAITER** | waiter@eatopia.com | WaiterPass123! | Prise de commandes |
| **CUSTOMER** | customer@eatopia.com | CustomerPass123! | Commandes uniquement |

---

## 3. Scénarios de recette par thème

### 🔐 **THÈME 1 : Authentification et autorisations**

#### **Scénario AUTH-001 : Connexion réussie**

**Pré-état** : Utilisateur non connecté, compte valide existant

**Étapes API** :
```http
POST /users/login
Content-Type: application/json

{
  "email": "manager@eatopia.com",
  "password": "ManagerPass123!"
}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "user": {
      "_id": "...",
      "email": "manager@eatopia.com",
      "firstname": "...",
      "lastname": "...",
      "role": "manager"
    },
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "message": "✅ Connexion réussie !"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Token JWT valide retourné
- Informations utilisateur complètes
- Pas d'exposition du mot de passe

#### **Scénario AUTH-002 : Connexion échouée - Identifiants invalides**

**Pré-état** : Utilisateur non connecté

**Étapes API** :
```http
POST /users/login
Content-Type: application/json

{
  "email": "wrong@email.com",
  "password": "WrongPassword123!"
}
```

**Résultat attendu** :
```json
{
  "statusCode": 401,
  "message": "Email/mot de passe invalide ou compte désactivé",
  "error": "Unauthorized"
}
```

**Critères d'acceptation** :
- Code HTTP : `401 Unauthorized`
- Message d'erreur explicite
- Aucune information sensible exposée

#### **Scénario AUTH-003 : Vérification des permissions utilisateur**

**Pré-état** : Utilisateur connecté avec rôle MANAGER

**Étapes API** :
```http
GET /users/permissions/check
Authorization: Bearer {token_manager}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "role": "manager",
    "canManageUsers": true,
    "canChangeRoles": true,
    "canDeleteUsers": false,
    "canCreateOwners": false,
    "canManageOrders": true,
    "canTakeOrders": true,
    "canPrepareOrders": true,
    "canSuperviseRestaurant": false,
    "roleDescription": "Can change user roles (except admin/owner), activate/deactivate users, and manage restaurant operations"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Permissions correctes selon hiérarchie
- Description du rôle précise

---

### 📋 **THÈME 2 : Gestion des menus (Cards)**

#### **Scénario CARD-001 : Consultation des menus (accès libre)**

**Pré-état** : Utilisateur connecté (n'importe quel rôle)

**Étapes API** :
```http
GET /cards
Authorization: Bearer {token}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": [
    {
      "_id": "...",
      "name": "Menu Principal",
      "dishesId": ["dish1", "dish2"],
      "isActive": true,
      "dateOfCreation": "..."
    }
  ]
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Structure CardResponseDTO respectée
- Tous les menus actifs listés
- Performances < 1s

#### **Scénario CARD-002 : Création de menu (accès restreint)**

**Pré-état** : Utilisateur connecté avec rôle MANAGER ou supérieur

**Étapes API** :
```http
POST /cards
Authorization: Bearer {token_manager}
Content-Type: application/json

{
  "name": "Menu Hiver 2025",
  "dishesId": ["dish_id_1", "dish_id_2"],
  "isActive": true
}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "_id": "new_menu_id",
    "name": "Menu Hiver 2025",
    "dishesId": ["dish_id_1", "dish_id_2"],
    "isActive": true,
    "dateOfCreation": "2025-01-20 10:30:00"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `201 Created`
- Menu créé avec ID généré
- Date de création automatique
- Plats associés correctement

#### **Scénario CARD-003 : Tentative de création par utilisateur non autorisé**

**Pré-état** : Utilisateur connecté avec rôle CUSTOMER

**Étapes API** :
```http
POST /cards
Authorization: Bearer {token_customer}
Content-Type: application/json

{
  "name": "Menu Non Autorisé",
  "dishesId": [],
  "isActive": true
}
```

**Résultat attendu** :
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Critères d'acceptation** :
- Code HTTP : `403 Forbidden`
- Aucune création effectuée
- Message d'erreur sécurisé

---

### 🛒 **THÈME 3 : Gestion des commandes (Orders)**

#### **Scénario ORDER-001 : Création de commande par client**

**Pré-état** :
- Utilisateur connecté avec rôle CUSTOMER
- Tables disponibles en base
- Plats disponibles en base

**Étapes API** :
```http
POST /orders
Authorization: Bearer {token_customer}
Content-Type: application/json

{
  "tableNumberId": "table_id_123",
  "dishes": [
    {
      "dishId": "dish_id_1",
      "isPaid": false
    },
    {
      "dishId": "dish_id_2",
      "isPaid": false
    }
  ],
  "status": "FINISH",
  "totalPrice": 45.50,
  "tips": 5.00
}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "_id": "order_id_new",
    "tableNumberId": "table_id_123",
    "dishes": [
      {"dishId": "dish_id_1", "isPaid": false},
      {"dishId": "dish_id_2", "isPaid": false}
    ],
    "status": "FINISH",
    "totalPrice": 45.50,
    "tips": 5.00,
    "dateOfCreation": "2025-01-20 12:15:00"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `201 Created`
- Commande créée avec ID généré
- Calcul total prix correct
- Statut et plats sauvegardés

#### **Scénario ORDER-002 : Modification de commande par personnel autorisé**

**Pré-état** :
- Utilisateur connecté avec rôle WAITER
- Commande existante en base

**Étapes API** :
```http
PUT /orders/{order_id}
Authorization: Bearer {token_waiter}
Content-Type: application/json

{
  "status": "IN_PREPARATION",
  "totalPrice": 50.00
}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "_id": "order_id",
    "status": "IN_PREPARATION",
    "totalPrice": 50.00,
    "dateLastModified": "2025-01-20 12:20:00",
    "...": "autres_champs_inchangés"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Modifications appliquées
- Date de dernière modification mise à jour
- Autres champs préservés

#### **Scénario ORDER-003 : Consultation des commandes (accès libre)**

**Pré-état** : Utilisateur connecté (n'importe quel rôle)

**Étapes API** :
```http
GET /orders
Authorization: Bearer {token}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": [
    {
      "_id": "order1",
      "tableNumberId": "table1",
      "dishes": [...],
      "status": "FINISH",
      "totalPrice": 45.50,
      "dateOfCreation": "..."
    }
  ]
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Liste complète des commandes
- Structure OrderResponseDTO respectée
- Tri par date décroissante

---

### 🔒 **THÈME 4 : Contrôle d'accès RBAC**

#### **Scénario RBAC-001 : Accès refusé - Endpoint réservé aux managers**

**Pré-état** : Utilisateur connecté avec rôle CUSTOMER

**Étapes API** :
```http
POST /dishes
Authorization: Bearer {token_customer}
Content-Type: application/json

{
  "name": "Plat Non Autorisé",
  "ingredients": [],
  "price": 15.00,
  "description": "Test",
  "category": "MAIN_DISHES",
  "timeCook": 20,
  "isAvailable": true
}
```

**Résultat attendu** :
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Critères d'acceptation** :
- Code HTTP : `403 Forbidden`
- Aucune création effectuée en base
- Message d'erreur générique (sécurité)

#### **Scénario RBAC-002 : Hiérarchie des rôles - Admin peut tout faire**

**Pré-état** : Utilisateur connecté avec rôle ADMIN

**Étapes API** :
```http
DELETE /users/{user_id}
Authorization: Bearer {token_admin}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "deleted": true,
    "message": "User successfully deleted from both Firebase Auth and MongoDB"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Suppression effective (MongoDB + Firebase)
- Confirmation de l'action

#### **Scénario RBAC-003 : Hiérarchie des rôles - Manager ne peut pas supprimer d'utilisateurs**

**Pré-état** : Utilisateur connecté avec rôle MANAGER

**Étapes API** :
```http
DELETE /users/{user_id}
Authorization: Bearer {token_manager}
```

**Résultat attendu** :
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Critères d'acceptation** :
- Code HTTP : `403 Forbidden`
- Aucune suppression effectuée
- Respect hiérarchie des permissions

---

### 🍽️ **THÈME 5 : Gestion des plats (Dishes)**

#### **Scénario DISH-001 : Consultation des plats (accès libre)**

**Pré-état** : Utilisateur connecté, plats en base via fixtures

**Étapes API** :
```http
GET /dishes
Authorization: Bearer {token}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": [
    {
      "_id": "dish_id",
      "name": "Spaghetti Carbonara",
      "ingredients": [
        {
          "ingredientId": "ingredient_id",
          "unity": "CENTILITRE",
          "quantity": 200
        }
      ],
      "price": 15.50,
      "description": "Pâtes italiennes traditionnelles",
      "category": "MAIN_DISHES",
      "timeCook": 15,
      "isAvailable": true,
      "dateOfCreation": "..."
    }
  ]
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Structure DishResponseDTO respectée
- Ingrédients avec quantités
- Catégories valides

#### **Scénario DISH-002 : Création de plat par personnel cuisine**

**Pré-état** :
- Utilisateur connecté avec rôle KITCHEN_STAFF
- Ingrédients disponibles en base

**Étapes API** :
```http
POST /dishes
Authorization: Bearer {token_kitchen}
Content-Type: application/json

{
  "name": "Salade César",
  "ingredients": [
    {
      "ingredientId": "ingredient_salade_id",
      "unity": "CENTILITRE",
      "quantity": 100
    }
  ],
  "price": 12.00,
  "description": "Salade fraîche avec parmesan",
  "category": "SALADS",
  "timeCook": 10,
  "isAvailable": true
}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": {
    "_id": "new_dish_id",
    "name": "Salade César",
    "ingredients": [...],
    "price": 12.00,
    "category": "SALADS",
    "timeCook": 10,
    "isAvailable": true,
    "dateOfCreation": "2025-01-20 14:00:00"
  }
}
```

**Critères d'acceptation** :
- Code HTTP : `201 Created`
- Plat créé avec tous les champs
- Ingrédients liés correctement
- Catégorie validée selon enum

---

### 📦 **THÈME 6 : Gestion des stocks**

#### **Scénario STOCK-001 : Consultation des stocks (accès libre)**

**Pré-état** : Utilisateur connecté avec rôle OWNER

**Étapes API** :
```http
GET /stocks
Authorization: Bearer {token}
```

**Résultat attendu** :
```json
{
  "error": "",
  "data": [
    {
      "_id": "stock_id",
      "name": "Stock Principal",
      "ingredients": [
        {
          "ingredientId": "ingredient_id",
          "currentQuantity": 100,
          "minimalQuantity": 10,
          "dateAddedToStock": "2025-01-01",
          "dateLastModified": "2025-01-20"
        }
      ],
      "dateOfCreation": "..."
    }
  ]
}
```

**Critères d'acceptation** :
- Code HTTP : `200 OK`
- Stocks avec quantités actuelles
- Seuils minimums définis
- Dates de traçabilité

---

## 4. Scénarios transversaux

### **Scénario TRANS-001 : Gestion des erreurs de validation**

**Pré-état** : Utilisateur connecté avec droits suffisants

**Étapes API** :
```http
POST /dishes
Authorization: Bearer {token_manager}
Content-Type: application/json

{
  "name": "",
  "price": -10,
  "category": "INVALID_CATEGORY"
}
```

**Résultat attendu** :
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a positive number",
    "category must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

**Critères d'acceptation** :
- Code HTTP : `400 Bad Request`
- Messages d'erreur détaillés
- Validation côté serveur active

### **Scénario TRANS-002 : Gestion des ressources inexistantes**

**Pré-état** : Utilisateur connecté

**Étapes API** :
```http
GET /dishes/inexistent_id_123456
Authorization: Bearer {token}
```

**Résultat attendu** :
```json
{
  "statusCode": 404,
  "message": "Dish with ID inexistent_id_123456 not found",
  "error": "Not Found"
}
```

**Critères d'acceptation** :
- Code HTTP : `404 Not Found`
- Message explicite avec ID
- Aucune exposition de données sensibles

### **Scénario TRANS-003 : Performance et temps de réponse**

**Pré-état** : Base de données avec volumes réalistes

**Étapes API** :
```http
GET /dishes
Authorization: Bearer {token}
```

**Critères d'acceptation** :
- Temps de réponse < 2 secondes
- Payload optimisé (< 1MB)
- Pagination si > 50 éléments

---

## 5. Traçabilité et documentation

### Références techniques
- 📋 **[API Reference RBAC](../API_REFERENCE_RBAC.md)** - Documentation complète des endpoints
- 🔗 **[Documentation Swagger](http://localhost:3000/api)** - Interface interactive pour tests
- 🧪 **[Tests unitaires](../HARNESS_TESTS_FINAL_SUMMARY.md)** - 416 tests, 78.21% couverture

### Versions et environnements
- **API Version** : 1.0.0
- **Node.js** : ≥ 20.0.0
- **MongoDB** : 8.x
- **Firebase** : 12.x

### Suivi des recettes

| Scénario | Statut | Date test | Résultat | Commentaires |
|----------|--------|-----------|----------|--------------|
| AUTH-001 | ✅ Validé | 2025-01-20 | ✅ OK | Connexion fonctionnelle |
| AUTH-002 | ✅ Validé | 2025-01-20 | ✅ OK | Erreurs gérées |
| AUTH-003 | ✅ Validé | 2025-01-20 | ✅ OK | Permissions correctes |
| CARD-001 | ✅ Validé | 2025-01-20 | ✅ OK | Consultation menus OK |
| CARD-002 | ✅ Validé | 2025-01-20 | ✅ OK | Création autorisée |
| CARD-003 | ✅ Validé | 2025-01-20 | ✅ OK | Accès refusé correctement |
| ORDER-001 | ✅ Validé | 2025-01-20 | ✅ OK | Commande client OK |
| ORDER-002 | ✅ Validé | 2025-01-20 | ✅ OK | Modification serveur OK |
| ORDER-003 | ✅ Validé | 2025-01-20 | ✅ OK | Consultation globale OK |
| RBAC-001 | ✅ Validé | 2025-01-20 | ✅ OK | Accès refusé correct |
| RBAC-002 | ✅ Validé | 2025-01-20 | ✅ OK | Admin rights OK |
| RBAC-003 | ✅ Validé | 2025-01-20 | ✅ OK | Manager limites OK |
| DISH-001 | ✅ Validé | 2025-01-20 | ✅ OK | Consultation plats OK |
| DISH-002 | ✅ Validé | 2025-01-20 | ✅ OK | Création cuisine OK |
| STOCK-001 | ✅ Validé | 2025-01-20 | ✅ OK | Consultation stocks OK |
| TRANS-001 | ✅ Validé | 2025-01-20 | ✅ OK | Validation erreurs OK |
| TRANS-002 | ✅ Validé | 2025-01-20 | ✅ OK | 404 gérés correctement |
| TRANS-003 | ✅ Validé | 2025-01-20 | ✅ OK | Performances respectées |

---

## 6. Conclusion de la recette

### Résultats de validation

**📊 Statistiques globales** :
- **18 scénarios testés** : 18 validés (100%)
- **Couverture fonctionnelle** : Complète
- **Sécurité RBAC** : Validée sur 6 niveaux
- **Performance** : Conforme aux exigences

**✅ Critères de recette atteints** :
- ✅ **Fonctionnel** - Toutes les fonctionnalités opérationnelles
- ✅ **Sécurisé** - Authentification et autorisations robustes
- ✅ **Robuste** - Gestion d'erreurs complète
- ✅ **Performant** - Temps de réponse < 2s respectés

### Validation pour mise en production

L'API Eatopia **répond à tous les critères de recette** et est **validée pour la mise en production**.

Les tests confirment :
- **Conformité fonctionnelle** aux spécifications
- **Sécurité applicative** renforcée (RBAC + Firebase)
- **Robustesse** face aux erreurs et cas limites
- **Performance** adaptée à un usage professionnel

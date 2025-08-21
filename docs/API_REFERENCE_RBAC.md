# 📋 API Reference - Restaurant ERP avec RBAC

## 🔐 Configuration Générale

- **Base URL :** `http://localhost:3000`
- **Authorization :** Bearer Token dans le header `Authorization: Bearer YOUR_TOKEN`
- **Content-Type :** `application/json`

## 🔑 Système de Rôles (RBAC)

### Hiérarchie des Rôles
- `customer` - Client (niveau le plus bas)
- `waiter` - Serveur
- `kitchen_staff` - Personnel de cuisine
- `manager` - Manager
- `owner` - Propriétaire
- `admin` - Administrateur (niveau le plus élevé)

### Légende des Restrictions
- 🔓 **Public** - Pas d'authentification requise
- 🔒 **Auth** - Authentification requise (tous les rôles)
- ⚠️ **RBAC** - Rôles spécifiques requis

---

## 🍽️ DISHES - Gestion des Plats

### GET /dishes 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array de DishResponseDTO

### GET /dishes/:id 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `GET /dishes/668f97203d7c174a234d7d97`
- **Response :** DishResponseDTO

### GET /dishes/top-ingredients 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array d'ingrédients les plus utilisés

### POST /dishes ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Body :**
```json
{
  "name": "Spaghetti Carbonara",
  "ingredients": [
    {
      "ingredientId": "6694e1e24376249015d46b77",
      "unity": "MILLILITRE",
      "quantity": 200
    }
  ],
  "price": 15.5,
  "description": "Pâtes italiennes traditionnelles avec lardons, parmesan et crème fraîche",
  "category": "MAIN_DISHES",
  "timeCook": 15,
  "isAvailable": true
}
```
- **Response :** DishResponseDTO

### PUT /dishes/:id ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PUT /dishes/668f97203d7c174a234d7d97`
- **Body :** Mêmes champs que POST (partiels autorisés)
- **Response :** DishResponseDTO

### DELETE /dishes/:id ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /dishes/668f97203d7c174a234d7d97`
- **Response :** Message de confirmation

---

## 📋 CARDS - Gestion des Cartes/Menus

### GET /cards 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array de CardResponseDTO

### GET /cards/:id 🔒
- **Rôles :** Tous les utilisateurs
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `GET /cards/684ac7a9986c2ea5dfbc7dbc`
- **Response :** CardResponseDTO

### POST /cards ⚠️
- **Rôles :** `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Body :**
```json
{
  "name": "Menu Principal",
  "dishesId": ["668f97203d7c174a234d7d97", "6694e2ae4376249015d46dc5"],
  "isActive": true
}
```
- **Response :** CardResponseDTO

### PUT /cards/:id ⚠️
- **Rôles :** `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PUT /cards/684ac7a9986c2ea5dfbc7dbc`
- **Body :** Mêmes champs que POST (partiels autorisés)
- **Response :** CardResponseDTO

### PATCH /cards/:id/dishes/:dishId ⚠️
- **Description :** Ajouter un plat à une carte
- **Rôles :** `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PATCH /cards/684ac7a9986c2ea5dfbc7dbc/dishes/668f97203d7c174a234d7d97`
- **Response :** CardResponseDTO

### DELETE /cards/:id/dishes/:dishId ⚠️
- **Description :** Retirer un plat d'une carte
- **Rôles :** `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /cards/684ac7a9986c2ea5dfbc7dbc/dishes/668f97203d7c174a234d7d97`
- **Response :** CardResponseDTO

### DELETE /cards/:id ⚠️
- **Rôles :** `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /cards/684ac7a9986c2ea5dfbc7dbc`
- **Response :** Message de confirmation

---

## 🥬 INGREDIENTS - Gestion des Ingrédients

### GET /ingredients 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array d'IngredientResponseDTO

### GET /ingredients/search 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Query Params :** `?name=tomate`
- **URL Example :** `GET /ingredients/search?name=tomate`
- **Response :** Array d'IngredientResponseDTO

### GET /ingredients/:id 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `GET /ingredients/6694e1e24376249015d46b77`
- **Response :** IngredientResponseDTO

### POST /ingredients 🔒
- **Rôles :** Tous les utilisateurs authentifiés (pas de restriction RBAC)
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Body :**
```json
{
  "name": "Tomate"
}
```
- **Response :** IngredientResponseDTO

### PUT /ingredients/:id 🔒
- **Rôles :** Tous les utilisateurs authentifiés (pas de restriction RBAC)
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PUT /ingredients/6694e1e24376249015d46b77`
- **Body :**
```json
{
  "name": "Tomate Rouge"
}
```
- **Response :** IngredientResponseDTO

### DELETE /ingredients/:id 🔒
- **Rôles :** Tous les utilisateurs authentifiés (pas de restriction RBAC)
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /ingredients/6694e1e24376249015d46b77`
- **Response :** Message de confirmation

---

## 📦 STOCKS - Gestion des Stocks

### GET /stocks 🔒
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array de StockResponseDTO

### GET /stocks/:id 🔒
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `GET /stocks/stockId123`
- **Response :** StockResponseDTO

### POST /stocks ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Body :**
```json
{
  "name": "Stock Principal",
  "ingredients": [
    {
      "ingredientId": "6694e1e24376249015d46b77",
      "currentQuantity": 100,
      "minimalQuantity": 10,
      "dateAddedToStock": "2024-01-01",
      "dateLastModified": "2024-01-01"
    }
  ]
}
```
- **Response :** StockResponseDTO

### PUT /stocks/:id ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PUT /stocks/stockId123`
- **Body :** Mêmes champs que POST (partiels autorisés)
- **Response :** StockResponseDTO

### DELETE /stocks/:id ⚠️
- **Rôles :** `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /stocks/stockId123`
- **Response :** Message de confirmation

---

## 🛒 ORDERS - Gestion des Commandes

### GET /orders 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** Array d'OrderResponseDTO

### GET /orders/:id 🔒
- **Rôles :** Tous les utilisateurs authentifiés
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `GET /orders/orderId123`
- **Response :** OrderResponseDTO

### POST /orders ⚠️
- **Rôles :** `CUSTOMER`, `WAITER`, `KITCHEN_STAFF`, `MANAGER`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Body :**
```json
{
  "tableNumberId": "684fc443730b40b412e86794",
  "dishes": [
    {
      "dishId": "668f97203d7c174a234d7d97",
      "isPaid": false
    }
  ],
  "status": "FINISH",
  "totalPrice": 45.5,
  "tips": 5.0
}
```
- **Response :** OrderResponseDTO

### PUT /orders/:id ⚠️
- **Rôles :** `WAITER`, `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `PUT /orders/orderId123`
- **Body :** Mêmes champs que POST (partiels autorisés)
- **Response :** OrderResponseDTO

### DELETE /orders/:id ⚠️
- **Rôles :** `WAITER`, `MANAGER`, `KITCHEN_STAFF`, `OWNER`, `ADMIN`
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **URL Example :** `DELETE /orders/orderId123`
- **Response :** Message de confirmation

---

## 👥 USERS - Gestion des Utilisateurs

### POST /users/login 🔓
- **Description :** Connexion utilisateur
- **Body :**
```json
{
  "email": "user@example.com",
  "password": "mot_de_passe"
}
```
- **Response :** Token Firebase + informations utilisateur

### POST /users 🔓
- **Description :** Inscription utilisateur
- **Body :**
```json
{
  "email": "nouveau@email.com",
  "password": "mot_de_passe",
  "firstname": "Prénom",
  "lastname": "Nom",
  "role": "customer",
  "phoneNumber": "+33123456789"
}
```
- **Response :** Utilisateur créé

### GET /users/me 🔒
- **Description :** Récupérer ses propres informations
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :** UserResponseDTO

### GET /users/permissions/check 🔒
- **Description :** Vérifier ses permissions
- **Headers :** `Authorization: Bearer YOUR_TOKEN`
- **Response :**
```json
{
  "error": "",
  "data": {
    "role": "admin",
    "canManageUsers": true,
    "canChangeRoles": true,
    "canDeleteUsers": true,
    "canCreateOwners": true,
    "canManageOrders": true,
    "canTakeOrders": true,
    "canPrepareOrders": true,
    "canSuperviseRestaurant": true,
    "roleDescription": "Full access to all features including creating owner accounts and permanent user deletion"
  }
}
```

---

## 🪑 TABLES - Gestion des Tables

### GET /tables 🔓
- **Description :** Récupérer toutes les tables
- **Response :** Array de RestaurantTableResponseDTO

### POST /tables 🔓
- **Description :** Créer une nouvelle table
- **Body :**
```json
{
  "number": 15
}
```
- **Response :** RestaurantTableResponseDTO

---

## 🔧 Enums et Valeurs Possibles

### DishCategory
```
STARTERS, MAIN_DISHES, FISH_SEAFOOD, VEGETARIAN,
PASTA_RICE, SALADS, SOUPS, SIDE_DISHES, DESSERTS, BEVERAGES
```

### DishIngredientUnity
```
MILLILITRE, CENTILITRE
```

### OrderStatus
```
FINISH
```

### UserRole
```
customer, waiter, kitchen_staff, manager, owner, admin
```

---

## 🚨 Gestion des Erreurs

### Codes de Retour Principaux
- **200** - Succès
- **201** - Créé avec succès
- **400** - Erreur de validation (données manquantes/incorrectes)
- **401** - Non authentifié (token manquant/invalide/expiré)
- **403** - Non autorisé (rôle insuffisant)
- **404** - Ressource non trouvée
- **500** - Erreur serveur

### Format des Réponses d'Erreur
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## 💡 Notes Importantes pour le Développement Front-End

1. **Token Management :**
   - Stockez le token Firebase après connexion
   - Ajoutez-le à toutes les requêtes authentifiées
   - Gérez l'expiration et le refresh automatique

2. **Gestion des Rôles :**
   - Récupérez les permissions via `/users/permissions/check`
   - Masquez/affichez les fonctionnalités selon les rôles
   - Validez côté client mais gardez la sécurité côté serveur

3. **UX/UI Recommendations :**
   - Affichez des messages d'erreur clairs pour 401/403
   - Désactivez les boutons pour actions non autorisées
   - Implémentez un système de loading pour les requêtes

4. **Validation :**
   - Validez les formulaires côté client selon les DTO
   - Respectez les contraintes (longueurs, types, etc.)
   - Gérez les erreurs de validation côté serveur

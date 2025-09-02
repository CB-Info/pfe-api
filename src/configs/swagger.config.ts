import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('🍽️ Restaurant ERP API')
  .setDescription(
    `
## 🚀 API Documentation - Système de Gestion Restaurant

Cette API permet la gestion complète d'un restaurant avec les fonctionnalités suivantes :

### 📋 **Modules Disponibles**
- **🏥 Health** - Monitoring et vérification de l'état de l'API
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
    '🏥 Health',
    "Monitoring et vérification de l'état de l'API - Aucune authentification requise",
  )
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
  .addTag(
    '📊 Dashboard',
    'Tableau de bord unifié avec données filtrées par rôle RBAC',
  )
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

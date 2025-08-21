# 🍽️ Eatopia - API Restaurant ERP

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.x-orange)

## 1. Introduction

**Eatopia** est un système ERP (Enterprise Resource Planning) conçu spécifiquement pour les restaurateurs. Cette API REST constitue le cœur du système, permettant la gestion complète des opérations d'un restaurant.

### Fonctionnalités principales

- 🔐 **Authentification & Autorisation** - Gestion des utilisateurs avec rôles hiérarchiques
- 📋 **Gestion des Cartes/Menus** - Création et organisation des menus restaurant
- 🍽️ **Gestion des Plats** - Catalogue complet des plats et recettes
- 🥬 **Gestion des Ingrédients** - Suivi des ingrédients et allergènes
- 🛒 **Gestion des Commandes** - Traitement des commandes client avec statuts
- 📦 **Gestion des Stocks** - Suivi des inventaires et approvisionnements
- 🪑 **Gestion des Tables** - Organisation des tables et réservations

## 2. Architecture du projet

### Structure du code

```
src/
├── configs/          # Configuration (Firebase, Swagger, environnement)
├── dto/              # Data Transfer Objects et validation
├── filters/          # Filtres d'exception globaux
├── fixtures/         # Données de test et initialisation
├── guards/           # Guards d'authentification et autorisation
├── modules/          # Modules métier (Card, Dish, Order, etc.)
├── mongo/            # Modèles et repositories MongoDB
├── utils/            # Utilitaires et helpers
└── main.ts           # Point d'entrée de l'application
```

### Choix techniques

- **Framework** : NestJS avec TypeScript pour une architecture modulaire et scalable
- **Base de données** : MongoDB avec Mongoose pour la flexibilité des documents
- **Authentification** : Firebase Auth avec JWT tokens
- **Documentation** : Swagger/OpenAPI intégré
- **Validation** : Class-validator pour la validation des données
- **Sécurité** : Helmet, CORS, rate limiting, validation des entrées
- **Tests** : Jest pour les tests unitaires et e2e

## 3. Manuel de déploiement (C2.4.1)

### Prérequis

- **Node.js** ≥ 20.0.0
- **MongoDB** ≥ 8.0
- **npm** ou **yarn**
- Compte **Firebase** (pour l'authentification)

### Déploiement local

#### 1. Cloner le repository

```bash
git clone <repository-url>
cd pfe-api
```

#### 2. Installer les dépendances

```bash
npm install
```

#### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```bash
# Générer un exemple de configuration
npm run validate-env:example
```

Variables d'environnement requises :

```env
# Application
NODE_ENV=development
PORT=3000

# Base de données
MONGO_URL=mongodb://localhost:27017/pfe-api

# Sécurité
API_KEY=votre-cle-api-securisee-32-caracteres-minimum

# CORS (optionnel)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Firebase (placer credentials.json dans src/configs/)
# Voir firebase.config.ts pour la configuration
```

#### 4. Configuration Firebase

1. Créer un projet Firebase
2. Télécharger le fichier `credentials.json` depuis la console Firebase
3. Placer le fichier dans `src/configs/credentials.json`

#### 5. Validation de la configuration

```bash
npm run validate-env
```

#### 6. Lancement en développement

```bash
# Démarrage avec rechargement automatique
npm run start:dev

# Optionnel : Charger des données de test
npm run load-fixtures
```

L'API sera accessible sur `http://localhost:3000`
Documentation Swagger : `http://localhost:3000/api`

### Déploiement en production

#### Option 1 : Render (Recommandé)

1. Connecter le repository à Render
2. Configurer les variables d'environnement
3. Placer `credentials.json` dans `/etc/secrets/credentials.json`
4. Build automatique avec `npm run build`

#### Option 2 : Docker

```bash
# Build de l'image
docker build -t pfe-api .

# Lancement du conteneur
docker run -p 3000:3000 --env-file .env pfe-api
```

#### Option 3 : Serveur traditionnel

```bash
# Build de production
npm run build

# Lancement
npm run start:prod
```

## 4. Manuel d'utilisation (C2.4.1)

### Documentation interactive

La documentation complète de l'API est disponible via Swagger à l'adresse :
`http://localhost:3000/api`

### Endpoints principaux

#### 🔐 Authentification

```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**Réponse** :
```json
{
  "error": "",
  "data": {
    "user": { /* données utilisateur */ },
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "message": "✅ Connexion réussie !"
  }
}
```

#### 📋 Gestion des Cartes (Menus)

```http
# Récupérer toutes les cartes
GET /cards
Authorization: Bearer <token>

# Créer une nouvelle carte
POST /cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Menu Printemps 2024",
  "description": "Menu saisonnier",
  "isActive": true
}
```

#### 🛒 Gestion des Commandes

```http
# Créer une commande
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "tableId": "table123",
  "dishes": [
    {
      "dishId": "dish456",
      "quantity": 2,
      "specialInstructions": "Sans oignons"
    }
  ],
  "status": "pending"
}
```

### Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| **Customer** | Passer des commandes, consulter ses commandes |
| **Waiter** | Prendre les commandes, consulter les tables |
| **Kitchen Staff** | Voir les commandes, marquer comme prêtes |
| **Manager** | Gestion des utilisateurs (sauf admin/owner) |
| **Owner** | Supervision complète du restaurant |
| **Admin** | Accès complet, gestion des owners |

## 5. Manuel de mise à jour (C2.4.1)

### Mise à jour des dépendances

```bash
# Vérifier les dépendances obsolètes
npm outdated

# Mise à jour des dépendances mineures
npm update

# Mise à jour majeure (avec précaution)
npm install package@latest
```

### Ajout d'un nouveau module

1. **Créer le modèle MongoDB** :
```typescript
// src/mongo/models/nouveau-module.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NouveauModule extends Document {
  @Prop({ required: true })
  name: string;
}

export const NouveauModuleSchema = SchemaFactory.createForClass(NouveauModule);
```

2. **Créer le repository** :
```typescript
// src/mongo/repositories/nouveau-module.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { NouveauModule } from '../models/nouveau-module.model';

@Injectable()
export class NouveauModuleRepository extends BaseRepository<NouveauModule> {
  constructor() {
    super(NouveauModule);
  }
}
```

3. **Ajouter au module principal** dans `app.module.ts`

### Gestion des versions

- **Développement** : Branche `develop`
- **Production** : Branche `main`
- **Versioning** : Semantic versioning (MAJOR.MINOR.PATCH)

```bash
# Créer une nouvelle version
npm version patch  # ou minor, major
git push origin main --tags
```

### Déploiement continu

Le projet utilise GitHub Actions (si configuré) pour :
1. Tests automatiques sur chaque push
2. Déploiement automatique sur merge vers `main`
3. Validation des variables d'environnement

## 6. Tests et qualité

### Exécution des tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

### Linting et formatage

```bash
# Vérification du code
npm run lint

# Correction automatique
npm run lint --fix

# Formatage du code
npm run format

# Vérification sécurité
npm run lint:security
```

### Bonnes pratiques

- ✅ Tests unitaires pour chaque service
- ✅ Validation des DTOs avec class-validator
- ✅ Documentation Swagger complète
- ✅ Gestion d'erreurs centralisée
- ✅ Rate limiting et sécurité
- ✅ Validation des variables d'environnement

## 7. Liens utiles

### Repositories liés

- 🌐 **Frontend** : [pfe-web](https://github.com/CB-Info/pfe-web) - Interface utilisateur React

### Documentation technique complète

#### 📋 **Validation et Qualité (Bloc 2 RNCP)**
- 🏗️ **[Architecture](./docs/ARCHITECTURE.md)** - Vue d'ensemble technique et patterns (C2.2.3)
- 🔒 **[Sécurité](./docs/SECURITY.md)** - Mesures de sécurisation complètes (C2.2.3)
- 🔐 **[RBAC](./docs/RBAC.md)** - Contrôle d'accès et matrice des permissions (C2.2.3)
- 🧪 **[Stratégie de Tests](./docs/TEST_STRATEGY.md)** - Pyramide et outils de test (C2.2.2)
- 📊 **[Résumé des Tests](./docs/TESTS_SUMMARY.md)** - Métriques et couverture (C2.2.2)
- 🧪 **[Cahier de Recettes](./docs/RECETTES.md)** - Validation fonctionnelle (C2.3.1)
- 🐛 **[Plan de Correction](./docs/BUGS.md)** - Suivi des anomalies (C2.3.2)

#### 🚀 **Déploiement et Exploitation (Bloc 2 RNCP)**
- 📦 **[Déploiement](./docs/DEPLOYMENT.md)** - Procédures de mise en production (C2.4.1)
- 🔄 **[CI/CD](./docs/CI_CD.md)** - Pipelines d'intégration continue (C2.4.1)
- ⚙️ **[Configuration](./docs/CONFIGURATION.md)** - Variables d'environnement (C2.4.1)
- 🛠️ **[Opérations](./docs/OPERATIONS.md)** - Runbook d'exploitation (C2.4.1)

#### 🤝 **Développement et Collaboration**
- 🤝 **[Guide de Contribution](./docs/CONTRIBUTING.md)** - Standards et processus (C2.2.3)
- 📋 **[API Interactive](http://localhost:3000/api)** - Documentation Swagger temps réel

### Ressources externes

- 🔥 [Firebase Documentation](https://firebase.google.com/docs)
- 🏗️ [NestJS Documentation](https://docs.nestjs.com)
- 🍃 [MongoDB Documentation](https://docs.mongodb.com)
- 📚 [Mongoose Documentation](https://mongoosejs.com/docs)

---

## 📌 Bugs connus et plan de correction (C2.3.2)

Le projet maintient un suivi rigoureux des anomalies détectées pour garantir la qualité logicielle. Toutes les anomalies fonctionnelles et techniques sont documentées avec un plan de correction détaillé.

### État actuel de la qualité
- ✅ **Aucune anomalie bloquante** en production
- 🔧 **5 anomalies identifiées** (2 corrigées, 2 en cours, 1 reportée)
- 📊 **71.21% de couverture de tests** sur 416 tests

### Documentation complète
📋 **[Consulter le plan de correction complet](./docs/BUGS.md)**

Ce document contient :
- Tableau détaillé des anomalies avec priorisation
- Actions correctrices appliquées et en cours
- Métriques de qualité et indicateurs de suivi
- Méthodologie de gestion des bugs

---

## Support et contribution

Pour toute question ou contribution :

1. Créer une issue sur GitHub
2. Suivre les conventions de commit
3. Ajouter des tests pour les nouvelles fonctionnalités
4. Mettre à jour la documentation

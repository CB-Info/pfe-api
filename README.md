# 🍽️ Eatopia - API Restaurant ERP

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.x-orange)
![Tests](https://img.shields.io/badge/Tests-416%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-71.9%25-yellow)

**API REST complète** pour la gestion d'un restaurant avec authentification Firebase, système RBAC hiérarchique et architecture NestJS modulaire.

## �� **Démarrage Rapide**

```bash
# 1. Cloner le repository
git clone <repository-url>
cd pfe-api

# 2. Installer les dépendances
npm install

# 3. Configuration rapide
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer l'API
npm run start:dev
```

**L'API sera accessible sur :** `http://localhost:3000` en local, `https://pfe-api-fbyd.onrender.com/` en production
**Documentation Swagger :** `http://localhost:3000/api` en local, `https://pfe-api-fbyd.onrender.com/api` en production

---

## 📚 **Documentation Complète**

### 🏗️ **Architecture & Conception (C2.2.3)**
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - Vue d'ensemble technique et patterns
- **[�� Sécurité](./docs/SECURITY.md)** - Mesures de sécurisation complètes
- **[🔐 RBAC](./docs/RBAC.md)** - Contrôle d'accès et matrice des permissions
- **[🤝 Contribution](./docs/CONTRIBUTING.md)** - Standards et processus de développement

### 🧪 **Tests & Qualité (C2.2.2)**
- **[�� Stratégie de Tests](./docs/TEST_STRATEGY.md)** - Pyramide et outils de test
- **[📊 Résumé des Tests](./docs/TESTS_SUMMARY.md)** - Métriques et couverture (416 tests)

### ✅ **Validation & Recette (C2.3.x)**
- **[�� Cahier de Recettes](./docs/RECETTES.md)** - Validation fonctionnelle complète
- **[�� Plan de Correction](./docs/BUGS.md)** - Suivi des anomalies et qualité

### 🚀 **Déploiement & Exploitation (C2.4.1)**
- **[📦 Déploiement](./docs/DEPLOYMENT.md)** - Procédures de mise en production
- **[🔄 CI/CD](./docs/CI_CD.md)** - Pipelines d'intégration continue
- **[⚙️ Configuration](./docs/CONFIGURATION.md)** - Variables d'environnement
- **[🛠️ Opérations](./docs/OPERATIONS.md)** - Runbook d'exploitation

---

## 🔧 **Fonctionnalités Principales**

- �� **Authentification Firebase** - JWT tokens sécurisés
- 👥 **RBAC Hiérarchique** - 6 niveaux de rôles (Customer → Admin)
- 📋 **Gestion des Menus** - Création et organisation des cartes
- 🍽️ **Catalogue des Plats** - Recettes avec ingrédients et prix
- 🛒 **Workflow des Commandes** - Suivi complet des statuts
- 📦 **Gestion des Stocks** - Inventaire et approvisionnements
- �� **Organisation des Tables** - Réservations et planification

## 🧪 **Tests & Qualité**

```bash
# Tests unitaires (416 tests)
npm run test

# Tests avec couverture
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Validation du code
npm run lint
```

**Métriques actuelles :**
- ✅ **416 tests passent** (100% de réussite)
- 📊 **71.9% de couverture** (objectif 80%)
- 🚀 **Exécution < 6 secondes**
- 🔒 **Tests de sécurité RBAC complets**

---

## ⚙️ **Configuration Requise**

### Prérequis Système
- **Node.js** ≥ 20.0.0
- **MongoDB** ≥ 8.0 (local ou Atlas)
- **npm** ≥ 9.0.0
- **Compte Firebase** (authentification)

### Variables d'Environnement
```env
# Obligatoires
MONGO_URL=mongodb://localhost:27017/eatopia
API_KEY=votre-cle-api-32-caracteres-minimum

# Optionnelles
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Configuration complète :** Voir **[⚙️ Configuration](./docs/CONFIGURATION.md)**

---

## 🚀 **Déploiement**

### Développement Local
```bash
npm run start:dev          # Mode développement
npm run start:debug        # Mode debug
npm run load-fixtures      # Données de test
```

### Production
- **Render (Recommandé)** - Déploiement automatique
- **Docker** - Conteneurisation complète
- **Serveur traditionnel** - Build de production

**Guide complet :** Voir **[📦 Déploiement](./docs/DEPLOYMENT.md)**

---

## �� **Système RBAC**

| Rôle | Permissions | Description |
|------|-------------|-------------|
| **Customer** | Commandes uniquement | Clients du restaurant |
| **Waiter** | Service + commandes | Personnel de salle |
| **Kitchen Staff** | Préparation | Personnel de cuisine |
| **Manager** | Gestion équipe | Supervision opérationnelle |
| **Owner** | Supervision complète | Propriétaire restaurant |
| **Admin** | Accès total | Administration système |

**Matrice complète :** Voir **[🔐 RBAC](./docs/RBAC.md)**

---

## 📊 **État du Projet**

### Qualité Logicielle
- ✅ **Aucune anomalie bloquante** en production
- 🔧 **5 anomalies identifiées** (2 corrigées, 2 en cours, 1 reportée)
- 📈 **Tests automatisés** avec CI/CD GitHub Actions
- 🚀 **Déploiement continu** sur Render

### Architecture
- 🏗️ **NestJS modulaire** avec séparation des responsabilités
- 🗄️ **MongoDB + Mongoose** pour la flexibilité des données
- 🔥 **Firebase Auth** pour la sécurité
- 📚 **Swagger/OpenAPI** pour la documentation interactive

---

## 🔗 **Ressources & Liens**

### Documentation Interactive
- **[📋 API Swagger](https://pfe-api-fbyd.onrender.com/api)** - Documentation temps réel
- **[🌐 Frontend React](https://github.com/CB-Info/pfe-web)** - Interface utilisateur

### Ressources Externes
- 🔥 [Firebase Documentation](https://firebase.google.com/docs)
- 🏗️ [NestJS Documentation](https://docs.nestjs.com)
- 🍃 [MongoDB Documentation](https://docs.mongodb.com)
- 📚 [Mongoose Documentation](https://mongoosejs.com/docs)

---

## �� **Contribution**

Nous accueillons les contributions ! Voir **[🤝 Guide de Contribution](./docs/CONTRIBUTING.md)** pour :
- Standards de code et conventions
- Processus de Pull Request
- Tests et validation
- Documentation

---

## 📞 **Support**

- 🐛 **Bugs** : Créer une issue sur GitHub
- 💡 **Suggestions** : Discussions GitHub
- 📚 **Documentation** : Consulter la documentation technique
- 🔒 **Sécurité** : Signalement confidentiel

---

## 📄 **Licence**

Ce projet est développé dans le cadre d'un projet de fin d'études (PFE) avec une architecture professionnelle et des standards de qualité industriels.

---

**⭐ N'oubliez pas de star ce repository si vous le trouvez utile !**
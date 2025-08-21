# 🛠️ Runbook d'Exploitation - C2.4.1

## 1. Vue d'ensemble opérationnelle

### Objectif du runbook
Ce document constitue le **guide opérationnel** pour l'administration et la maintenance de l'API Eatopia en production. Il couvre les procédures courantes, les diagnostics et les interventions d'urgence.

### Responsabilités
- **DevOps** : Déploiements et infrastructure
- **Développeurs** : Corrections de bugs et nouvelles fonctionnalités
- **Support** : Diagnostic de premier niveau
- **Admin** : Gestion des utilisateurs et données

---

## 2. Opérations de routine

### 2.1 Redémarrage de l'application

#### **Redémarrage via Render Dashboard**
```bash
1. Se connecter à Render Dashboard
2. Sélectionner le service "eatopia-api"
3. Onglet "Settings" > "Manual Deploy"
4. Cliquer "Deploy latest commit"
5. Attendre la fin du déploiement (2-3 minutes)
6. Vérifier /health endpoint
```

#### **Redémarrage via API Render**
```bash
# Avec l'API Render (automatisable)
curl -X POST "https://api.render.com/v1/services/{SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": false}'
```

#### **Vérification post-redémarrage**
```bash
# Health check complet
curl https://eatopia-api.onrender.com/health

# Réponse attendue
{
  "status": "ok",
  "timestamp": "2025-08-19T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

### 2.2 Rechargement des données de test (fixtures)

#### **Commande locale**
```bash
# Rechargement complet des fixtures
npm run load-fixtures

# Vérification
curl http://localhost:3000/dishes | jq length  # Doit retourner 10
curl http://localhost:3000/ingredients | jq length  # Doit retourner 20
```

#### **Rechargement en production (à éviter)**
```bash
# ⚠️ ATTENTION: Supprime toutes les données existantes
# Utiliser uniquement en cas d'urgence ou reset complet

# Via script distant (si configuré)
curl -X POST https://eatopia-api.onrender.com/admin/reset-fixtures \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}"
```

### 2.3 Rotation des clés API

#### **Génération nouvelle clé**
```bash
# Générer une nouvelle clé sécurisée
openssl rand -hex 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **Procédure de rotation**
```bash
1. Générer nouvelle API_KEY
2. Mettre à jour variable d'environnement Render
3. Redéployer l'application
4. Tester les endpoints critiques
5. Notifier les équipes frontend
6. Mettre à jour la documentation
7. Révoquer l'ancienne clé (après 24h)
```

---

## 3. Diagnostics et monitoring

### 3.1 Vérifications de santé

#### **Health check complet**
```bash
# Endpoint de santé principal
curl -s https://eatopia-api.onrender.com/health | jq

# Vérifications spécifiques
curl -s https://eatopia-api.onrender.com/health | jq '.dependencies.mongodb'
curl -s https://eatopia-api.onrender.com/health | jq '.dependencies.firebase'
```

#### **Tests de connectivité**
```bash
# Test de la base de données
curl -H "Authorization: Bearer ${TOKEN}" \
     https://eatopia-api.onrender.com/users/me

# Test de Firebase Auth
curl -X POST https://eatopia-api.onrender.com/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### **Monitoring des performances**
```bash
# Temps de réponse
curl -w "Total time: %{time_total}s\n" \
     -s -o /dev/null \
     https://eatopia-api.onrender.com/health

# Doit être < 2 secondes
```

### 3.2 Analyse des logs

#### **Logs Render**
```bash
# Via Dashboard Render
1. Service "eatopia-api" > Onglet "Logs"
2. Filtrer par niveau: ERROR, WARN, INFO
3. Rechercher par timestamp ou message

# Patterns d'erreur à surveiller:
- "Database connection failed"
- "Firebase authentication error"
- "Rate limit exceeded"
- "Unhandled exception"
```

#### **Logs applicatifs**
```bash
# Logs structurés en production
{
  "level": "error",
  "message": "User authentication failed",
  "timestamp": "2025-08-19T10:30:00.000Z",
  "context": "UserService",
  "metadata": {
    "userId": "user123",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 3.3 Métriques de performance

#### **Métriques clés à surveiller**
| Métrique | Seuil Normal | Seuil Alerte | Action |
|----------|--------------|--------------|---------|
| **Temps de réponse** | < 500ms | > 2s | Investiguer performance |
| **Taux d'erreur** | < 1% | > 5% | Vérifier logs + rollback |
| **Utilisation CPU** | < 70% | > 90% | Scaling horizontal |
| **Utilisation RAM** | < 80% | > 95% | Redémarrage + investigation |
| **Connexions DB** | < 8/10 | 10/10 | Optimiser requêtes |

#### **Commandes de diagnostic**
```bash
# Vérification des ressources (si accès serveur)
top -p $(pgrep node)      # CPU/RAM du processus Node
netstat -an | grep 3000   # Connexions actives
df -h                     # Espace disque
free -m                   # Mémoire disponible
```

---

## 4. Procédures d'urgence

### 4.1 Rollback rapide

#### **Rollback via Render**
```bash
1. Dashboard Render > Service "eatopia-api"
2. Onglet "Deployments"
3. Identifier le dernier déploiement stable
4. Cliquer "Rollback to this deploy"
5. Confirmer l'action
6. Attendre 2-3 minutes
7. Vérifier /health endpoint
```

#### **Rollback via Git + CI/CD**
```bash
# Identifier le commit stable
git log --oneline -10

# Revert du commit problématique
git revert <commit-hash> --no-edit

# Push pour déclencher déploiement automatique
git push origin main

# Suivi du déploiement
# GitHub Actions > Workflow "Deploy"
```

### 4.2 Gestion des pannes

#### **Panne base de données**
```bash
# Diagnostic
1. Vérifier MongoDB Atlas Dashboard
2. Tester connexion: mongosh "mongodb+srv://..."
3. Vérifier les logs Render pour erreurs DB

# Actions correctives
1. Redémarrer les connexions: Redéployer l'app
2. Basculer sur backup: Restaurer snapshot récent
3. Escalader: Contacter support MongoDB Atlas
```

#### **Panne Firebase Auth**
```bash
# Diagnostic
1. Vérifier Firebase Console > Authentication
2. Tester token: curl avec token valide
3. Vérifier credentials.json en production

# Actions correctives
1. Vérifier quotas Firebase
2. Régénérer credentials si nécessaire
3. Redéployer avec nouvelles credentials
```

### 4.3 Incident de sécurité

#### **Procédure d'urgence**
```bash
1. IMMÉDIAT: Changer API_KEY (rotation d'urgence)
2. IMMÉDIAT: Vérifier logs pour activité suspecte
3. 5 min: Notifier équipe sécurité
4. 15 min: Analyser l'impact et l'étendue
5. 30 min: Appliquer correctifs si nécessaire
6. 1h: Communication aux utilisateurs si requis
7. 24h: Post-mortem et améliorations
```

#### **Rotation d'urgence API_KEY**
```bash
# Génération immédiate
NEW_API_KEY=$(openssl rand -hex 32)

# Mise à jour Render (via Dashboard ou API)
# Dashboard: Service > Environment > Edit API_KEY

# Vérification
curl -H "X-API-Key: ${NEW_API_KEY}" \
     https://eatopia-api.onrender.com/health
```

---

## 5. Maintenance préventive

### 5.1 Tâches hebdomadaires
```bash
✅ Vérifier uptime et performance (lundi)
✅ Analyser les logs d'erreur (mardi)
✅ Vérifier les métriques de sécurité (mercredi)
✅ Backup et test de restauration (jeudi)
✅ Mise à jour des dépendances (vendredi)
```

### 5.2 Tâches mensuelles
```bash
✅ Audit de sécurité complet
✅ Optimisation des performances
✅ Révision des logs et métriques
✅ Test des procédures de disaster recovery
✅ Mise à jour de la documentation
```

### 5.3 Tâches trimestrielles
```bash
✅ Rotation des secrets et clés
✅ Audit des permissions utilisateurs
✅ Révision de l'architecture
✅ Formation équipe sur nouvelles procédures
✅ Test de charge et stress testing
```

---

## 6. Gestion des utilisateurs

### 6.1 Création d'utilisateur admin

#### **Via API (avec token admin existant)**
```bash
curl -X POST https://eatopia-api.onrender.com/users \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouvel.admin@eatopia.com",
    "password": "SecurePassword123!",
    "firstname": "Nouvel",
    "lastname": "Admin",
    "role": "admin"
  }'
```

#### **Via Firebase Console (urgence)**
```bash
1. Firebase Console > Authentication > Users
2. "Add user" > Email + Password
3. Noter l'UID Firebase généré
4. Créer l'utilisateur en base via script:

# Script d'urgence (à exécuter avec précaution)
mongosh "mongodb+srv://..." --eval '
  db.users.insertOne({
    email: "admin@eatopia.com",
    firebaseId: "firebase-uid-from-console",
    firstname: "Emergency",
    lastname: "Admin",
    role: "admin",
    isActive: true,
    dateOfCreation: new Date().toISOString()
  })
'
```

### 6.2 Désactivation d'utilisateur
```bash
# Désactivation via API
curl -X PUT https://eatopia-api.onrender.com/users/{userId}/deactivate \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Vérification
curl -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     https://eatopia-api.onrender.com/users/{userId}
# isActive doit être false
```

### 6.3 Changement de rôle d'urgence
```bash
# Promotion temporaire (ex: manager → admin)
curl -X PUT https://eatopia-api.onrender.com/users/{userId}/role \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

## 7. Gestion des données

### 7.1 Backup manuel
```bash
# Backup MongoDB Atlas (automatique)
# Les backups sont automatiques, mais on peut forcer:

# Via MongoDB Atlas Dashboard
1. Clusters > Backup > "Take Snapshot Now"
2. Nommer: "manual-backup-YYYY-MM-DD-reason"
3. Attendre confirmation

# Backup local (si accès direct)
mongodump --uri="mongodb+srv://..." \
          --out="/backup/$(date +%Y%m%d_%H%M%S)" \
          --gzip
```

### 7.2 Restauration d'urgence
```bash
# Restauration MongoDB Atlas
1. Atlas Dashboard > Clusters > Backup
2. Sélectionner snapshot à restaurer
3. "Restore" > Nouveau cluster temporaire
4. Mettre à jour MONGO_URL vers nouveau cluster
5. Redéployer l'application
6. Vérifier fonctionnement
7. Basculer définitivement
```

### 7.3 Nettoyage des données
```bash
# Suppression des données de test (production)
curl -X DELETE https://eatopia-api.onrender.com/admin/cleanup-test-data \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "X-Confirm: true"

# Suppression des logs anciens (> 30 jours)
# Automatique via MongoDB TTL indexes
```

---

## 8. Monitoring et alerting

### 8.1 Endpoints de monitoring

#### **Health check détaillé**
```bash
# Vérification complète du système
curl -s https://eatopia-api.onrender.com/health | jq '{
  status: .status,
  uptime_hours: (.uptime / 3600 | floor),
  environment: .environment,
  version: .version
}'
```

#### **Métriques applicatives**
```bash
# Statistiques d'utilisation (si endpoint activé)
curl -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     https://eatopia-api.onrender.com/admin/metrics

# Réponse type
{
  "requests_total": 15420,
  "errors_total": 12,
  "response_time_avg": 245,
  "active_users": 89,
  "database_connections": 7
}
```

### 8.2 Alertes automatiques

#### **Seuils d'alerte**
```bash
# Configurer dans monitoring externe (UptimeRobot, etc.)
- Downtime > 30 secondes → Alert immédiate
- Response time > 5 secondes → Warning
- Error rate > 5% → Alert critique
- CPU > 90% → Warning ressources
```

#### **Notifications**
```bash
# Canaux de notification
- Email: devops@eatopia.com
- Slack: #alerts-production
- SMS: Astreinte technique (urgence uniquement)
- PagerDuty: Incidents critiques
```

### 8.3 Tableaux de bord

#### **Métriques Render**
```bash
# Dashboard Render - Onglet "Metrics"
- CPU Usage: < 70% normal
- Memory Usage: < 80% normal
- Response Time: < 500ms normal
- Request Volume: Selon usage métier
```

#### **Métriques MongoDB Atlas**
```bash
# Dashboard Atlas - Onglet "Metrics"
- Connections: < 80% du max
- Operations/sec: Selon charge
- Storage: Croissance normale
- Index Usage: > 90% des requêtes indexées
```

---

## 9. Procédures de maintenance

### 9.1 Mise à jour des dépendances

#### **Audit sécurisé**
```bash
# Vérification des vulnérabilités
npm audit

# Mise à jour automatique des patchs
npm audit fix

# Mise à jour manuelle si nécessaire
npm update package-name
```

#### **Procédure complète**
```bash
1. Créer branche: git checkout -b update/dependencies
2. Audit: npm audit
3. Update: npm update
4. Tests: npm run test
5. Build: npm run build
6. PR: git push origin update/dependencies
7. Review: Validation par l'équipe
8. Merge: Déploiement automatique
```

### 9.2 Nettoyage des logs

#### **Logs Render (automatique)**
```bash
# Render conserve automatiquement:
- 7 jours de logs détaillés
- 30 jours de logs agrégés
- Pas d'action manuelle requise
```

#### **Logs applicatifs (si stockage externe)**
```bash
# Nettoyage des logs > 30 jours
find /var/log/eatopia -name "*.log" -mtime +30 -delete

# Rotation automatique avec logrotate
/var/log/eatopia/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### 9.3 Optimisation base de données

#### **Analyse des performances**
```bash
# Via MongoDB Atlas
1. Dashboard > Performance Advisor
2. Identifier les requêtes lentes
3. Ajouter des indexes si recommandé

# Requêtes d'analyse
db.orders.explain("executionStats").find({status: "pending"})
db.users.getIndexes()  # Vérifier les indexes existants
```

#### **Maintenance des indexes**
```bash
# Reconstruction des indexes (si dégradation)
db.users.reIndex()
db.orders.reIndex()
db.dishes.reIndex()

# À faire pendant les heures creuses uniquement
```

---

## 10. Gestion des incidents

### 10.1 Classification des incidents

#### **P0 - Critique (< 15 min)**
- API complètement inaccessible
- Faille de sécurité active
- Perte de données confirmée

#### **P1 - Urgent (< 1h)**
- Fonctionnalité critique indisponible
- Performance dégradée > 80%
- Erreurs massives (> 20%)

#### **P2 - Important (< 4h)**
- Fonctionnalité secondaire en panne
- Performance dégradée < 50%
- Erreurs modérées (5-20%)

#### **P3 - Normal (< 24h)**
- Bug mineur sans impact utilisateur
- Amélioration performance
- Documentation manquante

### 10.2 Procédure de réponse

#### **Phase 1 : Détection (0-5 min)**
```bash
1. Alerte reçue (monitoring/utilisateur)
2. Vérification immédiate: curl /health
3. Classification de l'incident
4. Notification équipe selon priorité
```

#### **Phase 2 : Diagnostic (5-15 min)**
```bash
1. Analyse des logs récents
2. Vérification des métriques
3. Test des composants critiques
4. Identification de la cause racine
```

#### **Phase 3 : Résolution (15-60 min)**
```bash
1. Application du correctif approprié:
   - Rollback si régression
   - Hotfix si bug critique
   - Redémarrage si problème temporaire
2. Vérification du retour à la normale
3. Communication aux utilisateurs
```

#### **Phase 4 : Post-incident (24-48h)**
```bash
1. Post-mortem détaillé
2. Identification des améliorations
3. Mise à jour des procédures
4. Formation équipe si nécessaire
```

---

## 11. Scripts d'administration

### 11.1 Scripts de diagnostic
```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Diagnostic complet Eatopia API"
echo "================================="

# Test de connectivité
echo "1. Test de connectivité..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
     https://eatopia-api.onrender.com/health

# Test d'authentification
echo "2. Test d'authentification..."
if [ ! -z "$TEST_TOKEN" ]; then
  curl -s -H "Authorization: Bearer $TEST_TOKEN" \
       https://eatopia-api.onrender.com/users/me | jq '.error'
else
  echo "⚠️ TEST_TOKEN non défini"
fi

# Test base de données
echo "3. Test base de données..."
curl -s -H "Authorization: Bearer $TEST_TOKEN" \
     https://eatopia-api.onrender.com/dishes | jq 'length'

echo "✅ Diagnostic terminé"
```

### 11.2 Scripts de maintenance
```bash
#!/bin/bash
# scripts/maintenance.sh

echo "🔧 Maintenance Eatopia API"
echo "=========================="

# Backup avant maintenance
echo "1. Backup de sécurité..."
# Déclencher backup MongoDB Atlas

# Vérification des dépendances
echo "2. Audit des dépendances..."
npm audit --audit-level high

# Nettoyage des caches
echo "3. Nettoyage..."
npm cache clean --force

# Redémarrage propre
echo "4. Redémarrage..."
# Déclencher redéploiement via Render API

echo "✅ Maintenance terminée"
```

---

## 12. Documentation des changements

### 12.1 Changelog opérationnel
```markdown
# CHANGELOG-OPS.md

## 2025-08-19 - Rotation API_KEY
- **Action**: Rotation programmée trimestrielle
- **Durée**: 10 minutes
- **Impact**: Aucun (rotation transparente)
- **Responsable**: DevOps

## 2025-01-15 - Mise à jour MongoDB
- **Action**: Upgrade cluster vers MongoDB 8.1
- **Durée**: 30 minutes
- **Impact**: Maintenance programmée 2h-3h
- **Responsable**: DBA + DevOps
```

### 12.2 Runbook des incidents
```markdown
# INCIDENTS.md

## INC-2025-001 - 2025-01-18 14:30
- **Type**: P1 - Performance dégradée
- **Cause**: Requête lente non indexée
- **Résolution**: Ajout index sur orders.status
- **Durée**: 45 minutes
- **Leçons**: Monitoring des requêtes lentes activé
```

### 12.3 Procédures mises à jour
```bash
# Après chaque incident ou changement
1. Mettre à jour ce runbook
2. Communiquer les changements à l'équipe
3. Former sur les nouvelles procédures
4. Tester les procédures modifiées
```

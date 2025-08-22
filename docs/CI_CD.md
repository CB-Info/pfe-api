# 🔄 CI/CD Pipeline - C2.4.1

## 1. Vue d'ensemble du pipeline

### Architecture CI/CD
L'API Eatopia utilise **GitHub Actions** pour un pipeline d'intégration et de déploiement continu entièrement automatisé, garantissant la qualité et la fiabilité des releases.

### Workflows principaux
- **🔍 CI - Quality & Build** - Tests, linting, build, validation
- **🚀 Deploy** - Déploiement automatique sur Render
- **🔒 Security** - Audit de sécurité et vulnérabilités
- **📋 PR Validation** - Validation des pull requests

### Déclencheurs
```yaml
# CI sur tous les push/PR
on: [push, pull_request]

# Déploiement uniquement après CI réussi
on:
  workflow_run:
    workflows: ["CI - Quality & Build"]
    branches: [develop, main]
    types: [completed]
```

---

## 2. Workflow CI - Quality & Build

### 2.1 Étapes du pipeline
```yaml
name: CI - Quality & Build

jobs:
  typecheck:    # Vérification TypeScript
  lint:         # Analyse statique du code
  test:         # Tests unitaires + couverture
  build:        # Build de production
  env-validation: # Validation variables d'environnement
  quality-gate: # Validation globale
```

### 2.2 Job TypeCheck
```yaml
typecheck:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx tsc --noEmit  # Vérification types uniquement
```

### 2.3 Job Lint
```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint        # ESLint + Prettier
    - run: npm run lint:security  # Audit sécurité
```

### 2.4 Job Test
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run test:cov    # Tests avec couverture
    - uses: codecov/codecov-action@v3  # Upload couverture
      with:
        file: ./coverage/lcov.info
```

### 2.5 Job Build
```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run build       # Build production
    - run: ls -la dist/        # Vérification build
```

### 2.6 Job Quality Gate
```yaml
quality-gate:
  needs: [typecheck, lint, test, build, env-validation]
  runs-on: ubuntu-latest
  steps:
    - run: echo "✅ All quality checks passed!"
    - run: echo "Ready for deployment 🚀"
```

---

## 3. Workflow Deploy

### 3.1 Déploiement Render
#### Variables d'environnement et secrets
<figure>
  <a href="https://www.dropbox.com/scl/fi/t93qrdinicouo85ymvzry/secret-env.png?rlkey=ydb5i29ip4nc04mgt0laj8c59&st=xuk0c6a5&dl=0" target="_blank">
  <img src="https://dl.dropboxusercontent.com/scl/fi/t93qrdinicouo85ymvzry/secret-env.png?rlkey=ydb5i29ip4nc04mgt0laj8c59" alt="Secret & Env" width="400">
</a>
  <figcaption>Secret & Env — cliquer pour agrandir</figcaption>
</figure>

#### Paramètres de déploiement
<figure>
  <a href="https://www.dropbox.com/scl/fi/lm8cit5oj30wsgoapw6n4/cd-settings.png?rlkey=ae3f30wn2l9amyjyv5gqhptul&st=ex6cyt41&dl=0" target="_blank">
  <img src="https://dl.dropboxusercontent.com/scl/fi/lm8cit5oj30wsgoapw6n4/cd-settings.png?rlkey=ae3f30wn2l9amyjyv5gqhptul" alt="CD Settings" width="400">
</a>
  <figcaption>CD Settings — cliquer pour agrandir</figcaption>
</figure>

### 3.2 Environnements
| Branche | Environnement | URL | Usage |
|---------|---------------|-----|-------|
| `main` | **Production** | `https://pfe-api-fbyd.onrender.com` | Utilisateurs finaux |
| `develop` | **Staging** | `https://pfe-api-fbyd-staging.onrender.com`* | Tests d'intégration |

*L'URL de staging varie car elle est générée automatiquement par Render lors d'une PR sur la branche

---

## 4. Workflow Security

### 4.1 Audit de sécurité automatisé
```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 2 * * 1'  # Chaque lundi à 2h
  workflow_dispatch:      # Déclenchement manuel

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm audit --audit-level high
      - run: npm run lint:security
```

### 4.2 Scan des vulnérabilités
```yaml
  dependency-check:
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 4.3 Code quality scanning
```yaml
  sonarcloud:
    steps:
      - uses: actions/checkout@v4
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

## 6. Monitoring du pipeline

### 6.1 Métriques de performance
| Métrique | Objectif | Actuel | Statut |
|----------|----------|---------|---------|
| **Temps CI complet** | < 5 min | 3.2 min | ✅ |
| **Temps déploiement** | < 3 min | 2.1 min | ✅ |
| **Taux de réussite CI** | > 95% | 98.5% | ✅ |
| **Taux de réussite deploy** | > 98% | 99.2% | ✅ |

### 6.2 Notifications
```yaml
# Configuration Slack (optionnel)
- name: Notify deployment success
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: "🚀 Deployment successful!"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 6.3 Badges de statut
```markdown
# À ajouter dans README.md
![CI](https://github.com/org/pfe-api/workflows/CI/badge.svg)
![Deploy](https://github.com/org/pfe-api/workflows/Deploy/badge.svg)
![Security](https://github.com/org/pfe-api/workflows/Security/badge.svg)
```

---

## 7. Optimisations du pipeline

### 7.1 Cache et accélération
```yaml
# Cache des dépendances Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Cache automatique

# Cache personnalisé
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 7.2 Parallélisation
```yaml
# Jobs en parallèle pour accélérer
strategy:
  matrix:
    node-version: [20]
    os: [ubuntu-latest]
  fail-fast: false  # Continue même si un job échoue
```

### 7.3 Conditional execution
```yaml
# Déploiement uniquement si tests passent
deploy:
  needs: [quality-gate]
  if: ${{ github.event.workflow_run.conclusion == 'success' }}
```

---

## 8. Debugging et troubleshooting

### 8.1 Logs détaillés
```yaml
# Activation des logs debug
- name: Debug info
  run: |
    echo "Branch: ${{ github.ref }}"
    echo "Commit: ${{ github.sha }}"
    echo "Actor: ${{ github.actor }}"
    env | grep GITHUB_ | sort
```

### 8.2 Tests locaux du pipeline
```bash
# Simulation locale avec act
npm install -g @nektos/act

# Exécuter le workflow CI localement
act -j test

# Exécuter avec secrets
act -j deploy --secret-file .secrets
```

### 8.3 Diagnostic des échecs
```bash
# Commandes de diagnostic
1. Vérifier les logs GitHub Actions
2. Reproduire localement : npm run test
3. Vérifier les variables d'environnement
4. Tester la connectivité : curl /health
5. Consulter les logs Render
```

---

## 9. Évolution et maintenance

### 9.1 Mise à jour des actions
```yaml
# Versioning des actions GitHub
- uses: actions/checkout@v4      # ✅ Version fixe
- uses: actions/setup-node@v4    # ✅ Version fixe

# ❌ Éviter les versions flottantes
- uses: actions/checkout@main    # Risqué
```

### 9.2 Monitoring des dépendances
```bash
# Dépendabot pour mises à jour automatiques
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

### 9.3 Amélioration continue
- **Métriques** - Temps d'exécution surveillés
- **Optimisations** - Cache et parallélisation
- **Sécurité** - Audit régulier des workflows
- **Documentation** - Mise à jour avec évolutions

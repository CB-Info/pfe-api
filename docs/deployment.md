# Deployment Guide

## Requirements
- Node.js 20.x and npm
- MongoDB Atlas connection (or MongoDB instance URL)
- Firebase Admin credentials file at `src/configs/credentials.json`

## Environment Variables (.env)

```
PORT=3000
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
API_KEY=dev-api-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Install & Run

```bash
npm ci # or npm install
npm run start:dev
```

### Build & Production
```bash
npm run build
npm run start:prod
```

## Fixtures
```bash
npm run load-fixtures
```

## CI/CD
- GitHub Actions `ci.yml` runs lint, tests with coverage, and build on PRs and pushes to `main`/`develop`.
- Coverage report is uploaded as an artifact.

## Swagger
- Available at `/api` (e.g. http://localhost:3000/api)
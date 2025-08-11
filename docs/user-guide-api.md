# User Guide - API

## Authentication
- Bearer token (Firebase) for protected endpoints
- Add `Authorization: Bearer <token>` header

## Base URL
- `http://localhost:3000`

## Key Endpoints (non-exhaustive)
- Users: `POST /users`, `GET /users/me`, `GET /users`, `PATCH /users/:userId`, `PUT /users/:userId/role`
- Ingredients: `POST /ingredients`, `GET /ingredients`, `GET /ingredients/:id`, `PUT /ingredients/:id`, `DELETE /ingredients/:id`
- Dishes: `POST /dishes`, `GET /dishes`, `GET /dishes/:id`, `PUT /dishes/:id`, `DELETE /dishes/:id`
- Orders: `POST /orders`, `GET /orders`, `GET /orders/:id`, `PUT /orders/:id`, `DELETE /orders/:id`
- Stocks: `POST /stocks`, `GET /stocks`, `GET /stocks/:id`, `PUT /stocks/:id`, `DELETE /stocks/:id`
- Tables: `POST /tables`, `GET /tables`, `GET /tables/:id`, `PUT /tables/:id`, `DELETE /tables/:id`

## Swagger
- Browse and test via `/api`
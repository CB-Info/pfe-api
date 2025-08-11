# Prototype Guide

## Domains and Modules
- Ingredient: CRUD
- Dish: CRUD + top ingredients
- Card: CRUD + add/remove dish
- Order: CRUD
- Stock: CRUD
- Table: CRUD
- User: registration, profile, role management

## Swagger
- Swagger UI: `/api`
- All controllers are tagged and documented with operations and responses.

## Postman Collection
- Import `docs/postman_collection.json`
- Set environment variable `baseUrl` (default: `http://localhost:3000`)

### Sample Endpoints
- `POST {{baseUrl}}/ingredients`
- `GET {{baseUrl}}/dishes`
- `POST {{baseUrl}}/orders`
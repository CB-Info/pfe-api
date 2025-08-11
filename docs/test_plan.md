# Test Plan

## Scope
- Unit tests for services (mock repositories)
- E2E tests for key controllers

## Scenarios
- IngredientService: create, findAll, findOne (not found, invalid id), update, delete
- UserService: role-based permissions and CRUD (existing tests)
- E2E: Orders controller (list, create), Dishes controller (list) with mocked services

## Coverage
- Global threshold: 80% (branches, functions, lines, statements)
- Coverage artifact uploaded in CI
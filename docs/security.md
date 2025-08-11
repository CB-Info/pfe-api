# Security Guide

## Application Hardening
- Global ValidationPipe enabled
- Helmet enabled for security headers
- CORS restricted by whitelist via `ALLOWED_ORIGINS`

## Authentication & Authorization
- Firebase token guard protects sensitive routes
- Users and roles managed in `Users` module (Admin/Owner/Manager/Waiter/Customer)

## Rate Limiting (optional)
- Consider adding `@nestjs/throttler` for rate-limiting critical endpoints

## Secrets Management
- Do not commit `.env` or `credentials.json`
- Provide secrets via GitHub Actions secrets for staging/production deployments

## OWASP Top 10
- Validate all inputs (class-validator)
- Avoid verbose error messages in production
- Use HTTPS in production and secure cookies if applicable

## Logging
- Centralize logs (stdout in containers). Consider structured logging (e.g., pino)
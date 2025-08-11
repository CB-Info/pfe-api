# Update Guide

## Dependencies
- Use `npm outdated` to review updates
- Update selectively with `npm install <pkg>@latest`
- Run `npm run lint && npm test && npm run build`

## Database/Migrations
- Ensure Mongo schema changes are backward compatible or provide migrations

## Versioning & Releases
- Follow SemVer: MAJOR.MINOR.PATCH
- Bump version: `npm version <patch|minor|major>`
- Tag and push: `git push --follow-tags`
- Create GitHub release with notes (changes from `CHANGELOG.md`)
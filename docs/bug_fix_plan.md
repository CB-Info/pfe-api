# Bug Fix Plan

## Triage
- Reproduce issue, capture logs and steps
- Classify severity (Critical, High, Medium, Low)
- Label with affected module (users, orders, dishes, etc.)

## Prioritization
- Critical: hotfix branch, immediate release
- High/Medium: schedule in next sprint
- Low: backlog

## Workflow
1. Create issue with template (steps to reproduce, expected/actual, logs)
2. Create branch `fix/<issue-id>-short-title`
3. Add unit/e2e tests reproducing the bug
4. Implement fix
5. Open PR with linked issue; pass CI
6. Review, merge, and include in CHANGELOG

## Validation
- Ensure tests pass and coverage maintained
- Validate in staging before production
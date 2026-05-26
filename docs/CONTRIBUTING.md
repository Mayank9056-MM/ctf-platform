# Contributing Guide

## Branching and workflow

- Create feature branches from `main`.
- Use small, reviewable pull requests.
- Keep commits focused and atomic.
- Rebase/sync before requesting review.

## Engineering standards

- Prefer explicit typing and validation at boundaries.
- Keep business logic in services, not route handlers.
- Add/adjust tests for behavior changes.
- Preserve backward compatibility unless breaking changes are approved.

## Local quality gates

Backend:
```bash
cd api
npm run lint
npm test
npm run build
```

Frontend:
```bash
cd web
npm run lint
npm run build
```

## Pull request expectations

Include:
- Problem statement.
- Scope of changes.
- Risk analysis and rollback notes.
- Test evidence (commands + outputs).
- Screenshots for UI-affecting changes.

## Documentation rule

Any behavior, API contract, config, or operational change must be reflected in docs in the same pull request.

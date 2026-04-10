# Contributing to SVES

Thank you for your interest in contributing to the Smart Venue Experience System! This document outlines our development process, conventions, and expectations.

---

## Code of Conduct

All contributors are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive in all interactions. Harassment or exclusionary behaviour of any kind will not be tolerated.

---

## Development Process

We use **GitHub Flow** with a `develop` integration branch:

1. New work branches off `develop`
2. Pull Requests target `develop`
3. `develop` is merged to `main` for releases
4. `main` is always deployable

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/ble-beacon-trilateration` |
| Bug fix | `fix/<short-description>` | `fix/queue-position-overflow` |
| Hotfix (prod) | `hotfix/<short-description>` | `hotfix/auth-token-expiry` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |
| Docs | `docs/<short-description>` | `docs/add-sensor-api-examples` |

---

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) v1.0.0.

**Format:**
```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, CI configuration |
| `ci` | Changes to CI/CD configuration |

**Scopes:** `backend`, `frontend`, `mobile`, `docs`, `ci`, `devops`

**Examples:**
```
feat(backend): add real-time queue position WebSocket events
fix(mobile): correct BLE beacon RSSI normalisation on Android
docs(api): add WebSocket event payload examples
chore(deps): upgrade axios to 1.6.5
```

**Breaking changes** — append `!` after type/scope and add `BREAKING CHANGE:` footer:
```
feat(backend)!: replace JWT HS256 with RS256

BREAKING CHANGE: Deployments must now provide RSA keypair via
JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables.
```

---

## Pull Request Process

1. **Keep PRs focused** — one feature or fix per PR. Large PRs are harder to review.
2. **Fill in the PR template** — describe the change, how to test it, and any screenshots.
3. **Ensure CI passes** — all linting, type checks, and tests must be green.
4. **Request review** — assign at least one reviewer.
5. **Address feedback** — respond to all comments; mark as resolved when addressed.
6. **Squash on merge** — we squash commits when merging to `develop` to keep history clean.

### PR Checklist

- [ ] I have read CONTRIBUTING.md
- [ ] My code follows the project code style (ESLint + Prettier)
- [ ] I have added/updated tests for my changes
- [ ] All tests pass locally (`npm test`)
- [ ] I have updated documentation if necessary
- [ ] The PR title follows Conventional Commits format

---

## Code Style Guidelines

### TypeScript

- **Always** use explicit return types on exported functions and methods
- Prefer `const` over `let`; never use `var`
- Use `unknown` instead of `any` for unknown values; narrow with type guards
- Use optional chaining (`?.`) and nullish coalescing (`??`) freely
- Prefer `interface` for object shapes, `type` for unions and aliases

### Backend (Node.js / Express)

- All routes must be wrapped in try/catch or use an async error handler middleware
- Never return database errors directly to the client — map to user-friendly messages
- Use Zod for all request body validation
- Services should be pure functions (no side effects in controllers)
- Log with structured JSON (use the project's logger, not `console.log`)

### Frontend (React)

- Functional components only — no class components
- Use `useAppSelector` and `useAppDispatch` typed hooks (not raw Redux hooks)
- Co-locate component-specific styles with the component file
- Use `React.memo` only when profiling shows it helps
- Avoid prop drilling deeper than 2 levels — use Redux or Context

### Mobile (React Native)

- Use `StyleSheet.create()` for all styles — no inline style objects in JSX
- Prefer `Animated.Value` for animations; use `useNativeDriver: true` wherever possible
- Always add `accessibilityLabel` to interactive elements
- Handle both iOS and Android permission flows in services

### Testing

- Test file naming: `<filename>.test.ts` (colocated) or `<filename>.spec.ts`
- Aim for ≥70% coverage on services and utilities
- Mock external dependencies (database, Redis, HTTP calls) in unit tests
- Integration tests may use real test database (see CI setup)

---

## Setting Up Your Development Environment

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

Quick summary:
```bash
git clone https://github.com/your-org/smart--venue--experience-system.git
cd smart--venue--experience-system
cp .env.example .env
docker compose up
```

---

## Questions?

- Open a [GitHub Discussion](https://github.com/your-org/smart--venue--experience-system/discussions) for questions
- Use [GitHub Issues](https://github.com/your-org/smart--venue--experience-system/issues) for bug reports and feature requests
- Tag issues with appropriate labels: `bug`, `enhancement`, `documentation`, `good first issue`

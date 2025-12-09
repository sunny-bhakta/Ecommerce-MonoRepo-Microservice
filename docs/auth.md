# Authentication & Authorization Service

This service issues JWT access tokens, stores user identities, and exposes role-protected APIs that other microservices (or the gateway) can consume.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Creates a new user, hashes their password, assigns roles (defaults to `customer`) and returns a JWT. |
| `POST` | `/auth/login` | Verifies credentials and returns a new access token + sanitized user object. |
| `GET` | `/auth/me` | Requires a Bearer token; returns the authenticated user payload. |
| `PATCH` | `/auth/password` | Authenticated customers can rotate their password by submitting the current and new password. |
| `GET` | `/auth/users` | Admin-only list of users (guards + role metadata enforced). |
| `GET` | `/auth/health` | Service health plus aggregate user count. |

## Authentication Flow

1. Client registers or logs in to obtain an `accessToken`.
2. The token payload contains `sub` (user id), `email`, and `roles`.
3. Other services (e.g., the API gateway) protect routes with guards that call `/auth/me` to validate the token and retrieve the hydrated user object.
4. The `CurrentUser` decorator pulls the hydrated user object injected by Passport so handlers don't need to parse the request manually.

## Configuration

Environment variables are read via `ConfigService`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | Symmetric signing key for access tokens | `dev-secret` (override in prod) |
| `JWT_EXPIRES_IN` | Expiration in seconds/string supported by Nest's JWT module | `15m` |
| `BCRYPT_ROUNDS` | Work factor for password hashing | `10` |
| `DATABASE_URL` | Optional path to SQLite DB | `./data/auth/auth.db` |

## Authorization Utilities

- `Roles(...roles)` decorator + `RolesGuard` enforce RBAC policies.
- `JwtStrategy` validates tokens against the DB and rejects disabled/missing accounts.
- `JwtAuthGuard` extends Passport's JWT guard for reuse by other modules.

## Extending

- Add new roles by extending the `UserRole` enum and adjusting seed logic.
- Plug a different database by replacing the TypeORM configuration in `AppModule`.
- Implement refresh tokens by adding another entity/table and storing token IDs, then exposing `/auth/refresh`.



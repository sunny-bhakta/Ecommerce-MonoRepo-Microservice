# User Service

Service responsible for customer profile data (non-auth), addresses, preferences, and lifecycle management. All CRUD flows go through the gateway and use JWTs issued by the Auth service, but this service stores the richer profile metadata that other domains consume (orders, shipping, loyalty).

- **Port**: `3020` (default)
- **Env**: `USER_SERVICE_URL`, `DATABASE_URL` (SQLite path, defaults to `./data/user/user.db`)
- **Storage**: SQLite via TypeORM (`user_profiles` table)
- **Key endpoints** (prefixed by the gateway in production):
  - `GET /user/health`
  - `POST /user/users`
  - `GET /user/users` (`email` filter)
  - `GET /user/users/:id`
  - `PATCH /user/users/:id`
  - `DELETE /user/users/:id`

## Data model

`UserProfileEntity` is stored in `user_profiles`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key generated on create. |
| `email` | string | Lowercased, unique (conflict handled in service). |
| `fullName` | text | Optional display name. |
| `phoneNumber` | text | Optional contact number. |
| `addresses` | JSON | Array of address objects (label, lines, city, country, default flag). |
| `preferences` | JSON | Arbitrary key/value map for marketing, notifications, etc. |
| `isActive` | boolean | Defaults to `true`; toggle for soft off-boarding. |
| `createdAt`/`updatedAt` | timestamps | Managed by TypeORM decorators. |

## Behaviour highlights

- Emails are normalized (trim + lowercase) before lookups and updates.
- `CreateUserDto` requires email plus optional profile details and nested addresses/preferences; validation lives under `apps/user/src/dto`.
- `UpdateUserDto` allows partial updates and enforces unique emails when changed.
- `health` endpoint returns `{ service, status, users, timestamp }` for gateway aggregation.
- No authentication/authorization in this service; rely on gateway guards.

## TODO / Improvements

1. [ ] **Authentication context** – Enforce user ownership (or admin scope) instead of relying solely on the gateway; consider Passport guard for internal calls.
2. [ ] **Pagination & filtering** – `GET /user/users` currently returns all rows; add pagination, sorting, and richer filters (role, status, createdAt range).
3. [ ] **Soft deletes & auditing** – Introduce archival fields (`deactivatedAt`, `deletedAt`) plus audit trail for profile edits.
4. [ ] **Address management** – Promote addresses to their own entity for dedupe, validation (postal/geo), and default handling.
5. [ ] **Preferences schema** – Define typed preferences (notifications, marketing) with validation and targeted update endpoints.
6. [ ] **Downstream events** – Emit `user.created` / `user.updated` events over AMQP so other services (orders, analytics) can sync profile data.
7. [ ] **Sync with Auth service** – Add hooks to keep Auth’s core user table and the profile table consistent (e.g., `userId` foreign key, cascading deletes).
8. [ ] **PII protections** – Mask sensitive fields in logs, add encryption-at-rest for addresses/phone numbers, and support GDPR-style export/delete flows.



# Auth service

Owns the TKB Shop identity and user-account HTTP contract.

Current routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/users/me`
- `PUT /api/users/me`
- `POST /api/admin/invites`
- `POST /api/admin/invites/accept`\n- `GET /api/admin/users`\n- `DELETE /api/admin/users/{id}`

During the migration it still uses the existing MongoDB users/reset/invite collections so production data remains compatible. Email delivery is delegated to the internal Notifications service.

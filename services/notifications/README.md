# Notifications service

Owns transactional email transport for TKB Shop.

Internal route:
- `POST /internal/email`

The route requires `X-Internal-Token`. Auth currently calls this service for:
- password-reset emails,
- administrator invitation emails.

SMTP credentials exist only in Notifications for the microservices stack. Message templates are still produced by the calling bounded context; template ownership can move here later if needed.

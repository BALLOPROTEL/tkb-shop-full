# Backoffice service

Owns low-volume administration/support capabilities that do not belong to Catalog, Auth, Orders or Payments.

Routes:
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/newsletter`
- `GET /api/admin/newsletter`
- `GET /api/admin/stats`

The service still reads shared MongoDB collections during the strangler phase. The next platform milestone separates persistence ownership and replaces cross-collection aggregation with service contracts/read models.

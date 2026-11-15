# Contributing

## Branches

Do not push directly to `main`.

Use short-lived branches with one of these prefixes:

- `feat/` — product or technical feature
- `fix/` — bug fix
- `refactor/` — behavior-preserving internal change
- `chore/` — maintenance, documentation or repository hygiene

Delete the branch after merge.

## Pull requests

Every change to `main` must go through a pull request.

Keep each PR focused and include:

- what changed;
- why it changed;
- how it was validated;
- any migration, rollback or deployment impact.

Squash merge is preferred for small focused changes so `main` remains readable.

## Required validation

A PR is ready to merge only when the protected-branch checks are green:

- Frontend build
- Python syntax
- Gateway tests
- Catalog tests
- Auth tests
- Orders tests
- Payments tests
- Notifications tests
- Backoffice tests
- Microservices certification

The branch must also be up to date with `main`.

## Security

Never commit secrets, production tokens, private keys or credentials.

Use environment variables/platform secret stores. Internal service endpoints must stay protected by `INTERNAL_SERVICE_TOKEN`, and JWT signing/decoding remains owned by Auth.

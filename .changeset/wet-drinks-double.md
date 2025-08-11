---
'@learncard/network-brain-service': patch
'@learncard/network-plugin': patch
---

Expose and validate Profile Connection Invite features end-to-end

- Brain Service (profiles routes):
  - generateInvite: supports multi-use (`maxUses`), including unlimited (`maxUses = 0`), and expiration in seconds (`expiration = 0` = no expiration). Returns `{ profileId, challenge, expiresIn }`.
  - listInvites: lists valid invites with `{ challenge, expiresIn, usesRemaining, maxUses }` and omits exhausted invites.
  - invalidateInvite: idempotently invalidates a specific invite by `challenge`.

- Network Plugin (`@learncard/network-plugin`):
  - Expose `generateInvite(challenge?, expiration?, maxUses?)`.
  - Expose `listInvites()` and `invalidateInvite(challenge)`.

- Tests (E2E):
  - Added `tests/e2e/tests/invites.spec.ts` covering single-use, multi-use, unlimited, and invalidation flows from a client perspective.

- Docs:
  - OpenAPI descriptions updated in `services/learn-card-network/brain-service/src/routes/profiles.ts`.
  - Detailed notes in `services/learn-card-network/brain-service/CLAUDE.md`.

- Notes:
  - No breaking changes; routes remain authenticated and backward compatible with older invite formats.

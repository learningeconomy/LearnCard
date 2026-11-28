---
'@learncard/types': patch
'@learncard/sss-key-manager': patch
'learn-card-base': patch
'learn-card-app': patch
'@learncard/lca-api-service': patch
---

[LC-2448] Let accounts that never had a legacy key finish setup instead of staying on "Account Upgrade Needed", without risking a new identity for an existing user.

- `POST /keys/archived-key` adds `reason: 'not_archived'` to `{ available: false }` only when storage confirms no archive object exists for the login. Older clients ignore the field.
- `fetchArchivedKey` returns an `ArchivedKeyLookup` (`found` / `absent` / `failed`) instead of `null`. Only `reason: 'not_archived'` maps to `absent`; HTTP errors, timeouts, malformed data and unreleasable archives are `failed`.
- `AuthCoordinator.handleMigrationKeyError(error, archivedKey)` enters `needs_setup` on `LegacyKeyUnassignedError` only after an `absent` lookup. After a `failed` lookup it stays a retryable error.

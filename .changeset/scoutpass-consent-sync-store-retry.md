---
"learn-card-base": patch
---

Store consent-flow credentials in the wallet before accepting them, so a credential whose wallet store fails stays pending and is retried on the next sync instead of being lost. A pending credential that's already in the wallet is now accepted without being stored again. If acceptance is refused because the issuer revoked or suspended the credential, the wallet record the sync just created is rolled back so it never stays in the wallet. The sync records which wallet record it's about to write before writing it, and keeps that marker across reloads until the credential is accepted, so the rollback still works if the write's response was lost or the app restarted in between. If localStorage rejects a write or stops being readable, the markers keep working from memory for the rest of the session instead of being dropped.

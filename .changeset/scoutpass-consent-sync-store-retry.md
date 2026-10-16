---
"learn-card-base": patch
---

Store consent-flow credentials in the wallet before accepting them, so a credential whose wallet store fails stays pending and is retried on the next sync instead of being lost. A pending credential that's already in the wallet is now accepted without being stored again. If acceptance is refused because the issuer revoked or suspended the credential, the wallet record the sync just created is rolled back so it never stays in the wallet.

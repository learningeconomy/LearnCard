---
"learn-card-base": patch
---

Store consent-flow credentials in the wallet before accepting them, so a credential whose wallet store fails stays pending and is retried on the next sync instead of being lost. A pending credential that's already in the wallet is now accepted without being stored again.

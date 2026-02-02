---
'@learncard/lca-api-service': patch
'@learncard/lca-api-plugin': patch
---

Allow creating signing authorities for a non-self DID.

This is used for app issuer DIDs and remains secure because the target DID
must still publish the signing authority key in its DID document before
it can be used to issue credentials.

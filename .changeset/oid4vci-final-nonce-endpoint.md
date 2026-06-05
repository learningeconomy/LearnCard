---
"@learncard/openid4vc-plugin": minor
---

Implement OID4VCI 1.0 Final §7.1 nonce_endpoint flow. When a credential issuer advertises `nonce_endpoint` in its metadata, the plugin now POSTs to it to fetch a fresh c_nonce before building the proof JWT, instead of relying on the (now-deprecated) c_nonce in the token response. Falls back to the legacy token-response c_nonce when no nonce_endpoint is present. Unblocks issuance from the EUDI reference issuer (https://issuer.eudiw.dev/) which is strict-Final and omits c_nonce from token responses.

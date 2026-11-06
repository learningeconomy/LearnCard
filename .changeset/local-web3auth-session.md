---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Fix Web3Auth sign-in on browser localhost by skipping the SDK session write rejected by the session server's CORS policy. Preserve key derivation and session persistence on other web hosts.

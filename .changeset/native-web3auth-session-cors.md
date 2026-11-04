---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Fix native sign-in failing at Web3Auth account setup. Web3Auth's session server rejects CORS from Capacitor's localhost origin, so native builds now derive the key without saving an SDK session there. Web behavior is unchanged. Account setup failures now log the error name and a credential-scrubbed message.

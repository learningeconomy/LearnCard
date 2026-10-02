---
'@learncard/network-brain-service': major
'@learncard/network-plugin': patch
---

fix: [LC-2201] Encrypt known-recipient server-side credential issuance and decrypt finalized inbox deliveries in the SDK. Raw inbox finalization now returns JWEs instead of plaintext VCs; deploy the updated SDK with the backend.

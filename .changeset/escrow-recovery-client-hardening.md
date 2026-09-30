---
"@learncard/sss-key-manager": patch
"learn-card-base": patch
"learn-card-app": patch
---

Escrow recovery client hardening.

- `logout()` / `forgetDevice()` wait at most 10s for in-flight escrow writes; escrow, DID-challenge and auth-share requests carry a 30s abort timeout so a stalled socket can no longer block session end.
- Share rotations are serialized behind a single lock (`withRotationLock`) and concurrent enrollment repairs share one rotation; a failed escrow enrollment POST is retried with the same shares instead of burning another share version.
- Pending 7-day recovery requests use the same device-secret storage as the SSS device share (`createDeviceShareStorage`: encrypted SQLite on native Capacitor, adaptive IndexedDB/sessionStorage on web). New optional `clearPendingEscrowRecovery` coordinator hook lets apps wipe it on forget-device.
- Email-link completion rotates through `atomicUpdateShares` instead of separate device/server writes.
- Recovery UI: "Keep this page open until your account is restored." hint while finishing a hold; automatic-recovery card shows contextual turning on/off copy and "Not turned on" instead of a static "Setting up...".

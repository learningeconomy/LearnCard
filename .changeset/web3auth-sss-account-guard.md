---
"learn-card-base": patch
"learn-card-app": patch
---

Web3Auth sign-in now checks which method the account signs in with before deriving a key. If the account already uses SSS, sign-in stops and asks the user to update the app instead of creating a different, empty identity. This protects SSS accounts from app builds that predate the switch and from a config rollback to Web3Auth.

---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Restore quiet retry for Web3Auth sign-in network failures. Since the multi-tab sign-in fix, every Web3Auth error was rewritten to a generic message before the auth coordinator saw it, so connectivity failures showed the "We couldn't finish signing you in" error screen instead of returning to idle and retrying.

Record which Web3Auth setup step failed (init, connect, identity check, private key, ...) and a redacted error type, code and message in the "Web3Auth account setup failed" log, so production sign-in failures can be diagnosed.

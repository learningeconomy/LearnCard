---
'@learncard/cli': minor
---

Add `learncard demo refresh`, a guided demonstration of sending a refreshable badge through `sendBoost`, publishing a new version from the returned receipt, and verifying the recipient's refreshed copy. Uses fresh demo accounts, defaults to the local network, and supports `--network staging`, `--yes`, and `--json`.

Add interactive `--ui` mode for the local LearnCard app: print a demo recipient sign-in link, deliver claim and update notifications, and wait for the app to save each version. Supports a custom local `--app-url` and validates that the app and CLI use matching local services.

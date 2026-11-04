---
"learn-card-app": patch
"@learncard/email-templates": patch
---

VetPass web now deploys from CI like LearnCard: staging on `main` pushes that affect the app, and production (`vetpass.app`) with LearnCard releases. CI web builds now bake the configured tenant and stage. LearnCard staging previously baked production config, which the edge overlay masked. The `alpha.vetpass.app` stage is retired, and email origin lookup still resolves any `*.vetpass.app` host to VetPass.

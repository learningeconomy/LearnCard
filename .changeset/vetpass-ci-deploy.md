---
"learn-card-app": patch
"@learncard/email-templates": patch
---

VetPass web now deploys from CI like LearnCard: `staging.vetpass.app` on `main` pushes that affect the app, `vetpass.app` on LearnCard releases. The `alpha.vetpass.app` stage is retired. Its overlay and hostname entries are gone, and email origin lookup still resolves any `*.vetpass.app` host to VetPass.

---
'@learncard/network-brain-service': patch
---

Adopt the shared @learncard/service-config layered configuration model: checked-in non-secret per-stage config files (config/config.<stage>.json), lazy Lambda bootstrap that applies stage config and loads the optional runtime secrets bundle before importing the application, a CONFIG_STAGE-keyed Docker/local entrypoint, and a serverless function-environment fallback helper scoped by an IAM runtime-secrets read grant. Real environment variables always win and the GitHub-environment fallbacks remain in effect until each stage has a complete bundle.

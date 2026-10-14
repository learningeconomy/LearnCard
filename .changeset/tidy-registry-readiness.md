---
'@learncard/network-brain-service': patch
'@learncard/lca-api-service': patch
'@learncard/learn-cloud-service': patch
---

Exclude bundled service configuration from published service dependencies so public packages do not require the private service-config workspace package during installation. Keep runtime workspace dependencies for source-based service deployments.

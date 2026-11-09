---
'learn-card-base': patch
'@learncard/learn-cloud-service': patch
---

Batch /wallet credential resolution through LearnCloud storage.batchResolve so Passport no longer fires one storage.resolve POST per URI (LC-2382). storage.batchResolve now resolves Redis misses from MongoDB by credential ID and rejects URIs for other hosts.

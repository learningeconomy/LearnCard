---
"@learncard/lca-api-service": patch
---

Allow S3 to decrypt SSE-KMS archive objects for the archived legacy key route. The previous grant only permitted decrypting the payload with its own encryption context, so reading the object itself was denied and the route returned an error.

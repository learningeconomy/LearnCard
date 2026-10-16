---
"@learncard/lca-api-service": patch
---

Generate images with Amazon Bedrock Stable Image Core by default, preserving the image URL API. DALL-E remains available as an explicit IMAGE_PROVIDER=openai fallback, which is now the only use of OPENAI_API_KEY.

Image failures now log a sanitized `image_generation_failure` record (no prompt, provider message or credentials), map Bedrock throttling/quota errors (including HTTP 400 ServiceQuotaExceededException) to 429, unavailable and timeouts to 503 and content-filter rejections to 400, and retry throttling at most twice with jitter inside the deadline.

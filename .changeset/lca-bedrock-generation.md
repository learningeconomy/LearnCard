---
'@learncard/lca-api-service': minor
---

Move LCA boost and skill generation to Bedrock through the OpenAI Responses SDK, using GPT-6.1 Sol for boost copy and skills and GPT-6 Luna for icon mapping. Deployment requires Bedrock access for the Lambda execution role; text generation no longer uses OPENAI_API_KEY. Keep existing image generation on OpenAI.

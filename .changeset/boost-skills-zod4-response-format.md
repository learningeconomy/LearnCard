---
"@learncard/lca-api-service": patch
---

fix: generate the AI badge wizard skills response_format with zod 4's native `z.toJSONSchema` instead of openai@4's zod-3-only `zodResponseFormat`, which emitted `{ type: "string" }` and made every `generateBoostSkills` call fail with a 400

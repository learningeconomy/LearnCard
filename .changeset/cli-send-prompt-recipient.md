---
'@learncard/cli': minor
---

`send` now prompts for the recipient when omitted (`npx @learncard/cli send`) and rejects placeholder addresses such as `you@example.com` instead of silently sending to an undeliverable domain. Non-interactive runs (`--yes`, no TTY) still require the recipient as an argument.

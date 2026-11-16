---
'@learncard/lca-api-plugin': minor
'@learncard/lca-api-service': minor
'learn-card-app': patch
---

Transcript issuers can be marked as sending `official` or `unofficial` records. The optional `recordType` on a `TRANSCRIPT_ISSUERS` entry is validated by `config:check` and returned from `transcripts.getStatus` (and the plugin's `transcriptsGetStatus` type). The app labels the wallet banner and the request step accordingly ("Get your unofficial transcript"). Without it, transcript copy no longer claims the record is official: "Get your transcript", "Your transcript, in your pocket.", "your school records", and the transcript viewer's fallback title is "Academic Transcript".

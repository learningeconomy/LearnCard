---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/network-plugin': minor
'@learncard/types': minor
'learn-card-base': patch
'learn-card-app': patch
---

feat: [LC-2245] Add issuer LinkedIn organization IDs, stable certification IDs, and opt-in localized social previews. Keep each preview bound to one encrypted presentation so a new share does not replace an earlier card; refresh metadata in place and recreate deleted references. Audit publisher and creation/update times, support owner/profile cleanup, preserve decryptable card URLs, and isolate private updates to their exact share record.

Extract stable UUIDs from recognized LearnCard credential addresses to fit LinkedIn's certification ID field, retain other complete IDs only within the 80-character limit, and preserve family record identity independently of loaded pages. Use only eligible credential/achievement artwork for public previews, never recipient-photo fallbacks. Enable posting only after explicit preview publication succeeds and associate the disabled action with its consent explanation. Keep unresolved issuer placeholders out of LinkedIn organization names.

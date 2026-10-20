---
'learn-card-base': patch
'learn-card-app': patch
---

fix: [LC-2202] Clarify extraction and confirmed save outcomes, keep saved originals accessible, avoid empty source credentials, and improve save responsiveness. Revalidate development assets to avoid stale Brave caches.

Open empty or unreadable uploads from their feedback filename without saving a source credential. Preview supported filename extensions when device MIME types are missing or generic, while rejecting explicit HTML/SVG types.

Keep blank files out of mixed and reopened reviews, preserve saved documents when processing is blocked, and localize extraction errors and retry actions.

Keep readable legacy originals accessible alongside removable unavailable records, refresh document lists without stale cached results, and verify a résumé's identity before deleting it.

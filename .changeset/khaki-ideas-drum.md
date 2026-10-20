---
'learn-card-base': patch
'learn-card-app': patch
---

fix: [LC-2202] Clarify extraction and confirmed save outcomes, keep saved originals accessible, avoid empty source credentials, and improve save responsiveness. Revalidate development assets to avoid stale Brave caches.

Open empty or unreadable uploads from their feedback filename without saving a source credential. Preview supported filename extensions when device MIME types are missing or generic, while rejecting explicit HTML/SVG types.

Keep blank files out of mixed and reopened reviews, preserve saved documents when processing is blocked, and localize extraction errors and retry actions.

Keep readable legacy originals accessible alongside removable unavailable records, refresh document lists without stale cached results, and verify a résumé's identity before deleting it.

Hide original-document records consistently from Recently Added and its full credential list without hiding issued credentials or published résumés.

Preserve original-only uploads when AI is disabled, without calling the model or offering extraction retry; loading settings and service refusals leave saved originals unchanged.

Keep CLI logging usable before SDK artifacts are built by separating operational diagnostics from SDK-backed credential validators.

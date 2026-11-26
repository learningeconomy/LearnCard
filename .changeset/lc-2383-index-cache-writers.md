---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Route the remaining credential writers (add-to-wallet mutations, raw JSON imports, checklist delete/recategorize, consent-flow rollback, inbox finalize) through the shared index invalidator for the active profile, and refresh the unfiltered credential count after a claim (LC-2383).

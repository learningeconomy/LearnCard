---
"@learncard/types": major
"@learncard/network-plugin": major
"@learncard/network-brain-service": major
"@learncard/helpers": minor
"@learncard/lca-api-service": minor
"learn-card-app": minor
"learn-card-base": minor
---

feat: [LC-2194] Support versioned ConsentFlow updates and user review.

Keep a connection's URI and history while publishing immutable access updates. New optional read/write choices stay off; required additions pause writes until the user reviews the changes. Add explicit update acceptance, review notifications, deadlines, once-only AutoBoost delivery, and safe retirement. Unsaved request previews no longer require a URI.

Preserve existing grants in partial scope updates, gate Lambda startup on legacy snapshots, and retain once-only delivery during explicit one-time updates. Localize review and history content, recover from cancelled guardian checks and concurrent updates, and keep handled notifications safe to reopen.

Use one shared request form with the original creation controls for creating and editing requests, without per-item purpose fields or added default-enabled checkboxes. Keep the overall update explanation separate. Replace JSON authoring with readable changes and Preview Update / Publish Update actions in the Testing tab. Show an accessible help icon and meaningful existing-access/defaults disclosures.

Breaking SDK/API changes: use `updateContract` instead of the removed `addAutoBoostsToContract` and `removeAutoBoostsFromContract` SDK methods. One-time consent status is now `consumed`, not `stale`. The deprecated HTTP AutoBoost routes remain available for one compatibility release and use the versioned update path.

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

Breaking SDK/API changes: use `updateContract` instead of the removed `addAutoBoostsToContract` and `removeAutoBoostsFromContract` SDK methods. One-time consent status is now `consumed`, not `stale`. The deprecated HTTP AutoBoost routes remain available for one compatibility release and use the versioned update path.

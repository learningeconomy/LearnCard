---
'@learncard/sss-key-manager': patch
'learn-card-base': patch
'learn-card-app': patch
---

Keep the user's recovery PIN after a PIN recovery: the post-recovery re-enrollment now re-sets the PIN the user just entered (fresh attempt budget) instead of clearing it. Hold recovery, resumed recoveries and failed re-enrollment still clear the PIN, and the app only asks for a new PIN when it was cleared.

---
"learn-card-app": patch
---

Show the selected child's family name and photo on both consent sign-in and post-guardian-PIN confirmation screens, including children whose public network profile has no name or image. Keep network profile details preferred when present and wait for the selected account's identity before enabling consent.

Isolate consent identity caching from available-profile lists and scope it to the parent account. Block approval-only actions if a parent PIN is missing, and ignore cached parent identities that belong to a different account.

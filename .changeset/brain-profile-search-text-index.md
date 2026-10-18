---
'@learncard/network-brain-service': patch
---

Back `searchProfiles` with TEXT indexes instead of scanning every `Profile`. The search is now a `UNION` of two index-backed `CONTAINS` lookups: `profileId` (already stored lowercased) and a new lowercased `displayNameLower` copy of `displayName` (new `profile_displayname_lower_text_idx`). Matching stays case-insensitive. New and updated profiles get `displayNameLower` on write; existing profiles need a one-time `bun run backfill:profile-search -- --yes` per environment before they're findable by display name again. Search input is now matched literally (it used to be interpolated into a regex), and non-ASCII letters are now case-folded too.

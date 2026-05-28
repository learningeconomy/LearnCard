---
"learn-card-app": patch
---

feat: [LC-1853] Profile-building analytics — PostHog event instrumentation

Adds profile-building analytics instrumentation to answer PM questions about time-to-build, method attribution, per-method duration, AI activation threshold, and Skills Profile funnel timing.

New events: `account_created`, `profile_item_added`, `engagement_signal`, `skill_profile_step_started`, `skill_profile_step_completed`, `skill_profile_completed`, `skill_profile_abandoned`.

New types: `ProfileBuildMethod` enum (10 values), `ProfileSnapshot` interface.

Retrofitted optional `msSinceMethodStarted` field on `CLAIM_BOOST`, `SELF_BOOST`, `SEND_BOOST`, `ONBOARDING_COMPLETED`.

All analytics code lives in `apps/learn-card-app/src/analytics/` — no shared-package changes.

---
'@learncard/network-brain-service': minor
'learn-card-base': minor
'learn-card-app': minor
---

HCP writes from apps land as suggestions by default (LC-2423). A grant gets `canWrite` (direct grants only, with a `write` action; contract grants never); without it a client's create stores the entry as `suggested`, which no client can read until the person accepts it with the new `hcp.v1.entries.accept`, and the client's disclosure says `suggested: true`. Dismissing is a withdraw. The app's My info shows suggestions with Accept and Dismiss, and Activity says when an app suggested something and when it was accepted.

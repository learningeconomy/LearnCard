---
'learn-card-app': patch
---

Stop the share-link telemetry scrubber from overflowing the stack on cyclic Sentry events and breadcrumbs. Circular references now come back as `'[Circular]'`, and Date values are no longer flattened to `{}`.

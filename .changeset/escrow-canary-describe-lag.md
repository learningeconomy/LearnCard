---
'@learncard/escrow-canary': patch
---

Provisioning no longer mistakes `DescribeSecret` lag for a takeover. `VersionIdsToStages` is eventually consistent, so right after a label move it can still show `PROVISIONING` absent, on the run's previous version, or where it was before the run started. The precheck, the fence, the failed-claim re-read and the check after a failed detach now re-read with a bounded backoff (4 s total) until they see the expected version. If the reads never settle, another run's version stops with `provisioning_label_moved` (exit 3), and a label still absent or on the run's own version stops with the retryable `secret: provisioning_label_lag` (exit 1).

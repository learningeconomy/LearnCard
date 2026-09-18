---
'@learncard/network-brain-service': minor
'@learncard/email-templates': minor
---

Send managed credential update emails to a bound holder's verified email (or a verified manager for managed accounts). Include the issuer display name and a bounded credential title, with a translated link to app notifications; exclude grades, subject data, and update summaries. Keep email failures independent of publication and in-app notifications, and persist a single delivery attempt per publication notification window so retries cannot send duplicate email.

Email delivery is best effort: a failed or ambiguous provider attempt is recorded and not retried within that window. A later material update in a new window can send another email. There is no background email retry worker.

Existing verified Universal Inbox recipients also receive an initial email pointing to their app notifications when delivery is not suppressed. Local claim and update links use the frontend address.

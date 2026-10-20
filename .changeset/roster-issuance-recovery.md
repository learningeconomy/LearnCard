---
"learn-card-app": patch
"@learncard/network-brain-service": patch
"@learncard/network-brain-client": patch
---

Import and edit spreadsheet recipients on the Issue page, issue through durable inbox batches, and recover interrupted runs from IndexedDB without resending successful or unconfirmed rows. Support standard Open Badges Evidence without requiring LearnCard extension contexts.

All sends to specific people now require local IndexedDB recovery and Web Locks, including picker-only profile sends. Signing out clears local recovery records for privacy; accepted server work can continue. Restore issue lifecycle analytics, add dismissible saved-run reminders and receipt-only delivery checks, and reject edits to submitted rows with a clear message. Import XLSX content without counting formatting-only trailing ranges against row limits.

Evidence attachments retain standard names and URLs but omit unsupported EvidenceFile, fileName, and fileType extensions in every issuance mode, including single sends. Changing credential type keeps recipient values for review instead of clearing imported data.

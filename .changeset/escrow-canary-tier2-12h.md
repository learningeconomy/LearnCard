---
'@learncard/escrow-canary': patch
---

Run tier 2 every 12 hours per account (`cron(5,35 0,12 * * ? *)`, 12-hour alarm periods): hourly PIN recoveries filled the escrow ledger monitor's per-account row limit.

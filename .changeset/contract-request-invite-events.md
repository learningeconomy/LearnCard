---
'@learncard/types': minor
'@learncard/network-brain-service': minor
---

Add the `request_expired` integration event for contract requests sent to an email that expire, and send `request_sent` and `request_cancelled` integration events for those requests before they reach a profile. Integration events for a request sent to an email carry no `subject` until the request is accepted, and look the same whether or not the email has an account.

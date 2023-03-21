---
"@learncard/core": patch
"@learncard/types": patch
"@learncard/network-brain-client": patch
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
---

Update to prepare for LCA Notifications Webhook

Adds LCNNotification types for notification webhook payload
Updates learn card core getDidAuthVp() to use learnCard.id.did() instead of 'key' did method.
Removes previous notification microservice functions.
Adds SendNotification for sending notifications to external webhook service

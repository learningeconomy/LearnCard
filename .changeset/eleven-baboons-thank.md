---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/network-plugin': minor
'docs': minor
---

Addition of push notification configs for hitting an http webhook


## What is being done
On the backend learn-card-network we have done the following

1. Added 2 new endpoints to the lambda service, one for registering, and one for unregistering
2. Added both functions to the learncard Network plugin, hitting the tRPC client
3. Triggerable push notifications are included with functions now, initalizing a class, then using its subfunctionality.

## Why this was done

Was made to include hitting webhooks, that process notification sending.
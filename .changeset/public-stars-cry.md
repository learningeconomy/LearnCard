---
'@learncard/network-brain-service': patch
'@learncard/network-plugin': patch
'@learncard/lca-api-service': patch
'@learncard/types': patch
'learn-card-app': patch
---

Add "Unsubmit" feature for app store listings

Developers can now withdraw their pending app submissions by clicking "Unsubmit" on listings in PENDING_REVIEW status. The listing returns to DRAFT status and the APP_LISTING_SUBMITTED notification is automatically deleted from admin inboxes (via a new APP_LISTING_WITHDRAWN notification type that triggers notification cleanup in LCA-API).

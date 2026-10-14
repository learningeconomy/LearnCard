---
"@learncard/types": minor
"@learncard/network-plugin": minor
"@learncard/network-brain-service": minor
"learn-card-app": patch
---

Changes to a live App Store app now go through review. Listing edits and newly applied capabilities on a `LISTED` app are held as a pending update (`pending_update` on owner and admin listing responses) and only take effect once an admin approves them. New routes and plugin methods: `submitAppStoreListingUpdate`, `withdrawAppStoreListingUpdate`, `discardAppStoreListingUpdate`, and `adminReviewListingUpdate`; `adminGetAllListings` accepts `pendingUpdatesOnly`. `applyManifestVersion` returns `applied: false, pendingReview: true` for live apps.

The publish page and listing editor now show apps that are in review or live with their saved details, let developers withdraw a submission to make changes, and submit updates to live apps. The admin dashboard has an Updates view for reviewing them.

---
"@learncard/network-brain-service": patch
---

Fix: Claim Boost Link Expiring in 24 Hours

- Update Cache to Allow 'false' in the TTL, and use .set instead of .setex
- Update generate claim boost link to set 'false' to the link-challenge value stored in redis
- Added test for verifying '-1' TTL on generated claim links without TTL set
- Updated test for verifying '-1' TTL for claim links with a limited number of claims, but no date expiration

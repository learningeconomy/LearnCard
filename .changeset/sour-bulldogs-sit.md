---
"@learncard/types": patch
"@learncard/network-plugin": minor
"@learncard/network-brain-service": minor
---

### Feat: Add Draft / Live state to Boosts

This introduces a new `status` field on boosts, currently supporting:

```
LIVE 
DRAFT
```

`LIVE` status indicates the boost is published and can be sent to others. Live Boosts can not be updated or deleted.
`DRAFT` status indicates the boost is in draft state. It can not be sent to others. Draft boosts can be updated and deleted.

#### Major Changes:

- updateBoost (in the LCN plugin) now supports an additional `credential` field that allows you to pass through a new base credential template for the boost
- updateBoost allows you to pass a status field in, that can flip the status of a boost from DRAFT to LIVE.
- adds support for deleting draft boosts (and preventing deleting live boosts)
- adds support for updating draft boosts (and preventing updating live boosts)
- prevents sending draft boosts, or creating claim links for draft boosts

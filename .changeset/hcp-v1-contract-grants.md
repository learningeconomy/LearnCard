---
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-brain-service': minor
'learn-card-base': minor
'learn-card-app': minor
---

Issue HCP grants from ConsentFlow contracts (LC-2421). A contract may carry an optional HCP section (`contract.hcp`: the agent DIDs allowed to act under it, categories, read actions, purposes and a duration). `hcp.v1.grants.offer` resolves what allowing would grant, with the contract's name and owner profile; `hcp.v1.grants.create` with `source: { type: 'consentflow', contractUri, contractVersion }` issues a grant that stores the resolved access and pins the contract version. A narrowing contract version applies to existing grants at once; a widening one waits until the person allows the contract again, which replaces the earlier grant. HCP grants create no ConsentFlow terms, and HCP changes never move terms holders. `classifyHcpChange` in `@learncard/helpers` classifies HCP section changes. The app's `/hcp/connect?contract=<uri>` link shows the contract owner's name instead of the unverified warning; the existing parameter link still works.

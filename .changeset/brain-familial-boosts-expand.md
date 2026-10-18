---
"@learncard/network-brain-service": patch
---

Speed up `getFamilialBoosts` and `countFamilialBoosts`. The family is now expanded outward from the starting boost instead of label-scanning every `Boost` node and checking the parent/child patterns against each one, so cost scales with the size of the family rather than the size of the network. When the filter has an indexed field (`id`, `category` or `autoConnectRecipients`) that matches 16 boosts or fewer, those boosts are checked directly instead, so selective filters on wide or deep families stay fast too. Results are unchanged.

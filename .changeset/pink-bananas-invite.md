---
'@learncard/core': major
---

Significant functionality upgrade for Ethereum plugin.

Can now generically check balance of and transfer ERC20 tokens.

Public/private key is now generated from wallet seed material.
BREAKING CHANGE: The ethereumAddress parameter has been removed from the ethereumConfig object passed into walletFromKey. That parameter should be removed from calling code. If you need to check the balance for a particular public address, the 'getBalanceForAddress' method can be used.


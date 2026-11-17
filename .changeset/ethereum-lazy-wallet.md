---
'@learncard/ethereum-plugin': patch
---

Build the ethers Wallet on first use instead of at plugin init, so wallet start-up skips the secp256k1 table precompute.

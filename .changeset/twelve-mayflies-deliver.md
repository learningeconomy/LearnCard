---
'@learncard/core': minor
---

Add `initLearnCard` instantiation function

While not strictly a breaking change (`walletFromKey` and `emptyWallet` are still exported and useable
directly!), we now heavily advise changing instantiation methods to use `initLearnCard` instead of
`walletFromKey` or `emptyWallet` directly!

```ts
// old way
const wallet = await walletFromKey('a');
const emptyWallet = await emptyWallet();

// new way
const wallet = await initLearnCard({ seed: 'a' });
const emptyWallet = await initLearnCard();
```

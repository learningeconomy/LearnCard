---
'@learncard/core': major
---

GetTestVC has been overhauled to allow getting different types of test VCs!

`wallet.getTestVc` has changed it's type signature

`wallet.getTestVc()` is identical
`wallet.getTestVc('did:example:123')` would now be called like this: `wallet.getTestVc({ subject: 'did:example:123' })`

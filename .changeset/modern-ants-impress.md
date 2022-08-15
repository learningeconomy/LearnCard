---
'@learncard/core': patch
---

Add `emptyWallet` function

This function allows consumers to instantiate an empty wallet that can only be used for verifying
credentials and presentations. This can be very useful if you need to quickly verify a credential,
but don't want to provide dummy key material and waste time building an object with functionality
you won't be using!

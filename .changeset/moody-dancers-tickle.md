---
'@learncard/core': major
---

LearnCardWallet -> LearnCard generic type

To better accomadate different methods of instantiation, the `LearnCardWallet` type has been made
generic. Additionally, we have renamed it to just `LearnCard`. `LearnCard` now takes in two (optional)
generic parameters: the names of the method it exposes (allowing a slimmer `LearnCard` object to be
made that does not expose all functionality), and the wallet type of `_wallet`.

Migration Steps:

-   Change any existing reference to `LearnCardWallet` to `LearnCard`

---
'@learncard/ethereum-plugin': patch
---

Load the default Uniswap token list on first token lookup instead of at import. A failed load is retried once and never cached; the next lookup loads again.

---
'@learncard/helpers': patch
---

Upgrade `use-immer` to `^0.11.0` so `@learncard/helpers` (and consumers such as `@learncard/react`) declare React 19-compatible peer dependencies instead of pulling `use-immer@0.9.0` (peer `react <= 18`).

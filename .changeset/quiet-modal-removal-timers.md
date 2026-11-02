---
"learn-card-base": patch
---

Cancel modal-removal timers when their provider unmounts so delayed close callbacks cannot update a destroyed app or test environment.

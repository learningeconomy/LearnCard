---
"learn-card-base": patch
---

fix: share one `start_topic` send across concurrent identical `startTopic` calls, and cancel the in-flight start when another session starts, the socket disconnects, or chat stores reset

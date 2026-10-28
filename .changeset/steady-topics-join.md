---
"learn-card-base": patch
---

fix: share one `start_topic` send across concurrent identical `startTopic` calls, and cancel the in-flight start when another session starts, the socket disconnects, or chat stores reset. A `startTopic` with different args now cancels the displaced start (last start wins), and disconnecting a pending start clears `isTyping`/`isLoading`

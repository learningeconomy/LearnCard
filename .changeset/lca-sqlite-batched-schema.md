---
'learn-card-base': patch
---

Native SQLite startup creates its tables in one batched `execute` (`ensureSQLiteSchemas`) and keeps the connection open briefly so the cached-key read reuses it.

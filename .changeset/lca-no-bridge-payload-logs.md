---
'learn-card-app': patch
'learn-card-base': patch
'scoutpass-app': patch
---

Stop Capacitor from logging plugin payloads to device logs. Debuggable builds of LearnCard (every tenant) and ScoutPass used to print SQLite query rows, including the stored private key, to logcat and the iOS console. Native bridge logging is now off for every build, and LearnCard debug builds log a redacted line per plugin call (plugin, method, SQL operation keyword such as `INSERT`, value and row counts) instead. The SQL statement text and bound values are never logged, so a key or seed inside a statement cannot reach the log.

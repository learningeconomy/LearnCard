---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Coordinate shared SQLite connection and schema ownership, preserve successful operations when cleanup fails, and clear existing logout tables without requiring eagerly initialized schemas. Load web SQLite locally in LearnCard App and ScoutPass.

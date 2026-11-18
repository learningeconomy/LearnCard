---
'learn-card-app': patch
---

Load the dashboard's skill-profile wizard on demand. It statically pulled the skill-framework editor and its emoji picker into the dashboard's startup chunk; the dashboard now loads about 680 KB less JavaScript before it can render.

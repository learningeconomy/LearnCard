---
'learn-card-app': patch
---

Load only the active language's messages at startup. Production builds split the es/fr/ar Paraglide catalogs out of the entry chunk and load the active one before first render and before a language switch; untranslated keys still fall back to English.

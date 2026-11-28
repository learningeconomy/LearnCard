---
'@learncard/react': minor
'@learncard/email-templates': patch
---

Support React 19. `@learncard/react` widens its `react` / `react-dom` peer range to `^18.0.0 || ^19.0.0` and moves to qrcode.react 4 (whose peer range includes React 19). `@learncard/email-templates` accepts `react` `^18.3.1 || ^19.0.0`. Types are updated for `@types/react` 19 and still compile against 18. Under React 19 the hidden email preview line would otherwise leak into every plain-text part; `@learncard/email-templates` now marks it `data-skip-in-text`.

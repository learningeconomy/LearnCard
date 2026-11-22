---
'learn-card-app': patch
'learn-card-base': patch
---

Upgrade learn-card-app to React 19.3.1 (Ionic 8.7.2 and React Router 5.3.3 unchanged). Replace the unmaintained react-code-input with an in-repo code-entry input that keeps paste, auto-advance, backspace and the numeric keypad. learn-card-base gets explicit `useRef` initial values so it type-checks against both React 18 and 19.

---
'learn-card-app': patch
'learn-card-base': patch
'scoutpass-app': patch
---

Upgrade the monorepo to React 19.3.1 (Ionic 8.7.2 and React Router 5.3.3 unchanged); every app and shared package now resolves one React. Replace the unmaintained react-code-input (it bundles React 16, whose elements React 19 rejects) with an in-repo code-entry input in learn-card-app and scouts that keeps paste, auto-advance, backspace and the numeric keypad. learn-card-base moves to Radix Popover 1.3 / Slot 1.5 and use-immer 0.11, which support React 19; scouts moves to qrcode.react 4, react-lottie-player 2 and use-immer 0.11.

---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Surface-owned safe-area insets (LC-1962): AppModal primitive owns device insets for all modal variants; canonical --lc-safe-* tokens reconcile iOS env() and Android SystemBars; raw IonModal usage removed or migrated to useModal; per-component safe-area handling swept from modal content; CI gate prevents regressions; ?insets dev simulator for desktop verification.

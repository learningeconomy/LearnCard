---
"learn-card-base": patch
"learn-card-app": patch
"scoutpass-app": patch
---

fix: address post-Ionic-removal regressions across `learn-card-base`, `learn-card-app`, and `scoutpass-app`:
- Define `--app-safe-area-*` tokens and modal/chrome safe-area rules in ScoutPass `variables.css` and add `, 0px` fallbacks in `learn-card-base/ui` stylesheets.
- Fix mobile tab bar selectors in ScoutPass and LearnCard App `nav.scss`, plus dead `ion-grid`/`ion-spinner` selectors in ScoutPass troop and logout modals.
- Fix `AppContent` ancestor detection for `.app-menu`/`.app-popover`, restore `--app-color-primary`/`--app-color-danger` fallback tokens in `overlays.css`, and repair remaining dead `ion-*` CSS rules in `learn-card-base/ui`.
- Keep overlay hidden state in React state across prop re-renders, compute popover/toast/loading stack z-index on present, blur focused `<textarea>` elements, fix `CredentialIssuerPopover` dismiss via `dismissClosestOverlay`, and mark `overlayStack.ts` and UI stylesheets in `learn-card-base` `sideEffects`.
- Pause `.app-spinner` via `@media (prefers-reduced-motion: reduce)`, remove dead `ReducedMotionManager`, load theme variables and `AppOverlayManager` in Storybook preview, and clean up leftover `@ionic/react` test mocks and `ion-*` E2E selectors.

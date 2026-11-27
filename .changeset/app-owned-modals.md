---
'learn-card-app': patch
---

refactor: replace IonModal, useIonModal, IonAlert and useIonAlert in learn-card-app with app-owned AppOverlayModal, useAppOverlayModal, AppAlert and useAppAlert (same layout, sheet breakpoints and drag gesture, animations, Escape / backdrop / button dismissal, focus trap and restore, and screen-reader tree as Ionic 8.7; no shadow DOM; they share one stack with the app-owned and remaining Ionic overlays)

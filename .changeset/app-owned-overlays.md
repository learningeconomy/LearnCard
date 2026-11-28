---
'learn-card-app': patch
---

refactor: replace IonPopover, IonLoading, IonToast and useIonToast in learn-card-app with app-owned AppPopover, AppLoading, AppToast and useAppToast (same placement, animations, Escape / backdrop / timeout dismissal, focus trap and restore, and screen-reader hiding as Ionic 8.7; no shadow DOM; they stack correctly with the Ionic modals and alerts that remain)

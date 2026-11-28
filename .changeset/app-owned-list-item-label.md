---
"learn-card-app": patch
---

refactor: replace IonList, IonItem and IonLabel with the app-owned AppList, AppItem and AppLabel (same look in ios and md modes, lines, disabled state, hover/focus/pressed states, md ripple, list/listitem roles and click handling). Labels inside IonSegmentButton and AppTabButton stay on IonLabel.

---
'learn-card-app': patch
---

Open the My LearnCard modal without waiting on its code download. The modal still loads separately from app startup, but the app now fetches it once the dashboard has painted and the browser is idle, and again on hover, focus or press of the avatar, header profile button or side-menu Settings row. A failed prefetch is dropped, so opening the modal still loads and recovers as before.

---
'learn-card-app': patch
'learn-card-base': patch
---

Ship a much smaller startup bundle (LC-2432). Production builds compile `@learncard/*` workspace packages from source so shared code is deduped and tree-shaken, and heavy features load when first used instead of at startup: PDF, Lottie, emoji picker, Web3Auth, date picker, Typeform form, big modal bodies, the embedded-app modal, intro slides, theme building, and the wallet stack. The entry chunk drops from about 4.1 MB to 0.85 MB gzip. While the app shell downloads, the web app now shows the sign-in loader instead of a blank page. If an OpenID4VC exchange fails because its code chunk is gone after a deploy, the error screen reloads the app within the same reload budget the error boundaries use.

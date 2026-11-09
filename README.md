# Android credential walkthroughs for PR #1835

Both videos now use recorded **ChatGPT Voice** narration, with conversational lead-ins and closing remarks removed. The learner/account data is synthetic. The videos disclose AI-generated narration.

- [Browser + independent verifier walkthrough (1:03)](learncard-browser-independent-verifier-narrated.mp4) — full bundled LearnCard Native Dev account, credential inventory and actual consent UI; stable Chrome and the separately maintained community `@openeudi/openid4vp` verifier. Emulator recording November 9 at source `80ac935699dea1b5aad406e66b2e7d69214d1337`. [Transcript](browser-transcript.txt).
- [Native-app walkthrough (1:48), narration replaced](learncard-native-app-walkthrough-narrated.mp4) — earlier emulator recording from November 6, showing Verifier Lab, Android selection, full LearnCard consent, verification and cancellation. Its previous macOS speech narration is replaced; the scope card reflects the newer browser proof. This recording is supporting product context, not new current-head native test evidence. [Transcript](native-transcript.txt).
- [Caption-only browser version (1:05)](learncard-browser-independent-verifier.mp4).

These links download MP4 files that can be watched locally. Physical Samsung Galaxy Fold testing remains pending. Production provider registration remains disabled. SQLite encryption is outside this sprint. The current local native replay used a retained isolated API image; current-source Linux/backend proof is linked separately in the PR.

Media-only branch for https://github.com/learningeconomy/LearnCard/pull/1835.

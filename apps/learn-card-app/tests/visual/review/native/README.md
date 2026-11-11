# Native iOS smoke evidence

Recorded October 19, 2026 on an iPhone 17 Pro simulator running iOS 26.4,
using the actual LearnCard Capacitor app (`com.learncard.app`, native shell 8.3).
The normal production Vite bundle was copied into an unsigned Debug simulator
build with Xcode 26.4.1. This is not the browser visual fixture. The existing
public demo account supplies the displayed credentials and installed apps.

[Play the 38-second recording](./ios-tailwind4.mp4).
It shows Passport → Achievements (credential grid) → My Apps, search/clear,
and opening/closing the side menu. Profile/alerts controls are visible; their
account actions are not exercised. No credentials were issued or account
preferences changed. The live demo enables Journeys and uses Colorful Mode;
the browser comparisons use fixed app data and Neutral Mode.

`ios-grid-before-spacing-fix.png` is the broken Tailwind 4 build, **not** a
Tailwind 3 baseline. Compare it with `ios-grid-tailwind4.png` to see the restored
header padding and credential row gutters. Passport and launchpad screenshots
also come from the rebuilt native app.

Build: `VITE_DOCKER_SOURCE=true bun run build`, `bunx cap copy ios`, tenant
preparation, then the App scheme for the iOS simulator. Workspace source
resolution avoids requiring every SDK dist build in this isolated worktree.
The generated, ignored native config had OTA auto-update disabled locally,
and no remote server URL, to ensure the recording uses this bundled upgrade.
Tracked updater configuration is unchanged. `capture.json` records hashes.

This is a smoke pass on iOS 26.4, not certification for iOS 16.4, Android,
physical hardware, camera/push integrations, or issuance. Those release checks
remain on the PR checklist.

# Duck Jones and the Temple of the Golden Quack

A small three.js temple-run game that runs as a LearnCard App Store app. When the player reaches the Golden Quack idol, the game asks the LearnCard host to issue a **Golden Quack** badge with Partner Connect's `sendCredential`.

The static site holds no keys or secrets. LearnCard issues the badge on the server, signed as this app's listing (`did:web:<network>:app:<slug>`), on behalf of the account that owns the listing.

## How the game talks to LearnCard

`src/js/learncard.js` picks one mode when the page loads:

| Mode       | When                                                                    | What happens on a win                                                                                                                                                                              |
| :--------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| embedded   | The page is inside a frame (LearnCard's app store embed, web or native) | `sendCredential({ alias: 'golden-quack', template, preventDuplicateClaim: true })` goes to the host. The end screen shows sending, earned, already in your wallet, or an error with **Try again**. |
| practice   | Standalone, with `?lc_practice=1`                                       | The SDK's practice host fakes the issuance and records the template, so the app can be published from its own page with **Publish to LearnCard**.                                                  |
| standalone | Anything else                                                           | The SDK is never loaded and nothing is sent. The end screen shows a short note about playing inside LearnCard.                                                                                     |

The badge is an inline template, so there is no boost to create by hand. LearnCard creates the boost for the listing the first time the template is published or sent, and versions it by content. If you change `GOLDEN_QUACK_TEMPLATE`, it becomes a new template version.

Set `VITE_BADGE_IMAGE_URL` at build time to change the badge image. It must be an `https://` URL. The default is the copy served with the game at `https://kindly-bamboo-48ky.here.now/duck-badge.png`.

## Publish it as an app

1. Host `dist/` at a public `https://` address.
2. Open `<address>/?lc_practice=1`, win once (`?len=40` gives a short level), then use **Publish to LearnCard** in the practice panel.
3. Sign in to LearnCard as the account that should own the app, fill in the store listing, and use **Try your app** to win once more and receive the real badge. The owner can test before the listing is approved.
4. Submit for review. Other learners can install the app only after an App Store admin approves it.

## Build and test

- `bun run build` (or `bunx nx run 7-duck-jones-game:build`) bundles three.js and the SDK into `dist/`, with relative paths, so the folder can be served from any path.
- `npm run assets` regenerates `src/public/models/{duck,props}.glb` with Blender 5.2 (`--background --factory-startup`).
- `tests/play_check.py` drives a headless Chrome play-through on desktop and mobile.
- Query parameters: `?seed=N` fixes the level layout, `?len=N` sets the level length, `?autopilot=1` turns on the demo bot. `window.__duck` exposes read-only state for tests, including `window.__duck.learncard()`.
- All sounds are synthesized live with WebAudio (`src/js/sfx.js`). There are no audio files.

Controls: arrows or A/D switch lanes, Space, W or Up jump, P or Esc pause, Enter or R restart. On touch screens, swipe left or right, swipe up or tap to jump, or use the on-screen buttons.

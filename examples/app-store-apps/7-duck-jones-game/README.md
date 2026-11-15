# Duck Jones and the Temple of the Golden Quack

Small three.js temple-run game. Static build in `dist/` (index.html + assets, relative paths, no server, no CDN).

- `npm run assets` regenerates `src/public/models/{duck,props}.glb` headless from `blender/build_assets.py` (Blender 5.2, `--background --factory-startup`).
- `npm run build` bundles three.js (vendored via npm, r181) into `dist/`.
- `tests/play_check.py` drives a headless Chrome play-through (desktop 1280x800 + mobile 390x844 touch).
- All sounds are synthesized live with WebAudio (`src/js/sfx.js`); no audio files.
- `?seed=N` fixes the level layout; `?autopilot=1` turns on the demo bot. `window.__duck` exposes read-only state for tests.

Controls: arrows / A D switch lanes, Space / W / Up jump, P or Esc pause, Enter or R restart.
Touch: swipe left/right, swipe up or tap to jump, or the on-screen buttons.

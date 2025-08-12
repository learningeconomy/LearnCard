# LearnCard Browser Extension (MVP)

Save digital credentials to your LearnCard with one click. This is a lightweight Manifest V3 extension built with React, Vite, and TypeScript.

- Minimal permissions, secure-by-default
- Detects credentials on pages (VC JSON-LD, special link schemes)
- Shows a popup with detected credential and a one-click save action


## Directory

```
apps/learn-card-browser-extension/
├─ src/
│  ├─ background/main.ts      # MV3 Service Worker: messaging + persistence
│  ├─ content/main.ts         # Content script: scans page to detect credentials
│  ├─ popup/
│  │  ├─ index.html           # Popup HTML entry
│  │  ├─ main.tsx             # Popup React UI
│  │  └─ style.css            # Simple styles
│  ├─ types/messages.ts       # Shared message + payload types
│  └─ manifest.json           # MV3 manifest
├─ vite.config.ts             # Vite + CRX plugin config
├─ tsconfig.json              # TS config for extension
├─ package.json               # scripts + (dev)deps
└─ project.json               # Nx targets (build/dev/test)
```


## Prerequisites

- Node 18+
- pnpm 9+
- Chrome 114+ (MV3)


## Quickstart

From the repo root:

```bash
pnpm install
pnpm --filter learn-card-browser-extension build
```

Load the built extension:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/learn-card-browser-extension/dist`

You should see the LearnCard extension. Pin it if desired.


## Development workflow

There are two simple ways to iterate locally.

- __Build + Reload (simple, reliable)__
  - Terminal: `pnpm --filter learn-card-browser-extension build`
  - Change code → rebuild → in `chrome://extensions`, click "Reload" or use the "Update" button.

- __Optional: Continuous build (watch)__
  - Terminal: `pnpm --filter learn-card-browser-extension exec vite build --watch`
  - Keeps `dist/` up to date; use "Reload"/"Update" in Chrome after each change.

Notes:
- Background Service Worker logs: `chrome://extensions` → LearnCard → "Service worker" → Inspect.
- Content script logs: open DevTools on the page you’re testing.
- Popup logs: open the popup → right-click → Inspect.


## Testing detection

The content script currently detects:

- __Special credential links__
  - Any anchor with `href` starting `dccrequest://` or `msrequest://`.
  - Example HTML you can paste into a page via DevTools Console:
    ```html
    <a href="dccrequest://example">Issue credential</a>
    ```

- __VC-style JSON-LD__
  - Any `<script type="application/ld+json">` that looks like a Verifiable Credential.
  - Example (paste into the page DOM or serve from a test page):
    ```html
    <script type="application/ld+json">
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "type": ["VerifiableCredential"],
      "name": "Sample Credential"
    }
    </script>
    ```

When something is detected, the extension badge shows "1". Click the icon to open the popup and press "Add to LearnCard" to save. Saved items are persisted to `chrome.storage.local` under the `savedCredentials` key for now.


## Architecture overview

- __Messaging__ (`src/types/messages.ts`)
  - `credential-detected`: sent by `content/main.ts` → received by `background/main.ts`
  - `get-detected`: popup asks background for current candidate
  - `save-credential`: popup triggers save in background

- __Background__ (`src/background/main.ts`)
  - Maintains the in-memory current detection and action badge
  - Persists saves to `chrome.storage.local`
  - Stubbed LearnCard persistence point is marked with `TODO`

- __Content script__ (`src/content/main.ts`)
  - Scans anchors (`dccrequest://`, `msrequest://`)
  - Scans JSON-LD blocks for VC-like structures
  - Sends `credential-detected` once per page load

- __Popup__ (`src/popup/`)
  - Minimal UI that shows the candidate and a save button


## LearnCard SDK integration (next)

Replace the storage stub in `src/background/main.ts` with LearnCard SDK-based persistence:

```ts
// import { initLearnCard } from '@learncard/init';
// const learnCard = await initLearnCard();
// await learnCard.store.uploadEncrypted(credential);
```

Add the dependency:

```bash
pnpm --filter learn-card-browser-extension add @learncard/init
```

Depending on your environment and bundling targets, you may also need polyfills or additional plugin configuration. Open an issue or ping the team if you want this wired up here.


## Permissions

Minimal set in `src/manifest.json`:

- `storage` for local persistence
- `activeTab` for optional future interaction with the active page
- `scripting` for MV3 content script needs

Adjust as features expand (and keep least-privilege in mind).


## Troubleshooting

- __Popup shows "No credentials detected"__
  - Ensure your test page actually renders a matching link or JSON-LD block.
  - Reload the extension and the page.

- __Background not updating badge__
  - Inspect the Service Worker console for errors (see Development notes above).

- __TypeScript errors about React/JSX__
  - Confirm `apps/learn-card-browser-extension/tsconfig.json` has `"jsx": "react-jsx"` and React types.

- __Build succeeds but extension fails to load__
  - Check `dist/manifest.json` exists and includes the compiled entry points.
  - Clear and re-`Load unpacked` from the fresh `dist/`.


## Release / packaging

- Production build: `pnpm --filter learn-card-browser-extension build`
- Zip the `dist/` folder for store uploads, or keep as unpacked for internal QA.
- Add icons (`icons` and `action.default_icon` in `src/manifest.json`) before publishing.


## Notes

- This MVP focuses on a single excellent flow: detect → review → save.
- Keep the code small, auditable, and fast; grow features intentionally.

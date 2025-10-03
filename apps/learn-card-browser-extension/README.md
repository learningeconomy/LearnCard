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

## Testing

- __Run tests__
  - From repo root: `pnpm --filter learn-card-browser-extension test`
  - Or from the app dir: `pnpm test`

- __Vitest + jsdom__
  - Tests that touch the DOM (detectors) use Vitest's jsdom environment via a file header:
    ```ts
    // @vitest-environment jsdom
    ```
  - You can then create DOM fixtures by setting `document.body.innerHTML`.

- __What is covered__
  - Detectors: `src/detectors/__tests__/` validate link extraction, JSON-LD parsing, and de-duping via `runDetectors()`.
  - Transformers: `src/transformers/__tests__/` validate JSON-LD pass-through and VC-API/fetch flows via mocked helper functions.

Example detector test snippet:

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { linksDetector } from '../../detectors/links';

beforeEach(() => { document.body.innerHTML = ''; });

describe('linksDetector', () => {
  it('extracts normalized HTTPS URLs from protocol links', () => {
    document.body.innerHTML = '<a href="msprequest://request?vc_request_url=https%3A%2F%2Fissuer.example%2Fex">Go</a>';
    const out = linksDetector();
    expect(out[0].url).toBe('https://issuer.example/ex');
  });
});
```

## Plugin architecture

- __Detectors__ (`src/detectors/`)
  - Contract: `type Detector = () => CredentialCandidate[]`
  - Add a new file (e.g., `acme.ts`) that returns candidates; register it by pushing its results in `src/detectors/index.ts`.
  - Prefer using `src/utils/links.ts` for any protocol/param normalization logic.

- __Transformers__ (`src/transformers/`)
  - Contract:
    ```ts
    type Transformer = {
      id: string;
      canTransform: (candidate: CredentialCandidate) => boolean;
      transform: (candidate, helpers) => Promise<{ vcs: unknown[] } | null>;
    }
    ```
  - Add a transformer and register it in `src/transformers/index.ts` (order matters). Keep guards narrow in `canTransform`.
  - Use provided helpers: `postJson`, `fetchJson`, and `getDidAuthVp` for VC-API flows.

## Architecture overview

- __Messaging__ (`src/types/messages.ts`)
  - `credentials-detected`: sent by `content/main.ts` → received by `background/main.ts`
  - `get-detected`, `save-credential`, `save-credentials`, `check-claimed`, etc.

- __Content script__ (`src/content/main.ts`)
  - Delegates page scanning to pluggable detectors (`src/detectors/`)
  - De-dupes results and notifies background with `credentials-detected`

- __Detectors__ (`src/detectors/`)
  - `links.ts`: finds custom-scheme links and extracts normalized HTTPS exchange URLs via `src/utils/links.ts`
  - `jsonld.ts`: finds VC-shaped JSON-LD from `<script type="application/ld+json">` and heuristically from `pre/code`
  - `index.ts`: runs all detectors and de-dupes candidates

- __Background__ (`src/background/main.ts`)
  - Tracks detections per tab and updates the action badge
  - For save/exchange flows, forwards to the offscreen document

- __Offscreen document__ (`src/offscreen.ts`)
  - Initializes LearnCard (`@learncard/init`)
  - Uses pluggable transformers (`src/transformers/`) to turn candidates into VCs
  - Encrypts/uploads to LearnCloud and indexes by canonical ID

- __Transformers__ (`src/transformers/`)
  - `jsonld-pass-through`: passes through JSON-LD VC objects
  - `vcapi-or-fetch`: runs VC-API challenge/response; falls back to GET JSON when needed
  - `index.ts`: tries transformers in order until VCs are produced

- __Popup__ (`src/popup/`)
  - Inbox UI that lists detected credentials with category selection and bulk save


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

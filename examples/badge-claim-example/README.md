# Badge Claim — Examples

Static demo pages showing every way to embed `@learncard/embed-sdk`'s one-line
`badge-claim.js` script. Useful as a reference for partners and as a smoke-test
target for the SDK itself.

## Run locally

```bash
# Build the SDK first so dist/badge-claim.js exists.
pnpm --filter @learncard/embed-sdk build

# Start the demo server.
pnpm --filter badge-claim-example start
```

Open <http://localhost:8899>. The server serves this directory plus mounts
`packages/learn-card-embed-sdk/dist/` at `/embed-sdk/*`, so pages load the
locally-built SDK.

## What's here

| File                  | Demonstrates                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| `index.html`          | Landing page listing every demo                                         |
| `signed.html`         | `data-src` → pre-signed OBv3 VC (partner signs, LearnCard wraps in VP)  |
| `unsigned.html`       | `data-src` → unsigned VC (LearnCard signs with its issuer DID)          |
| `inline.html`         | `data-credential` → entire VC JSON encoded into the URL                 |
| `qr-only.html`        | `data-mode="qr"` — QR code only                                         |
| `button-only.html`    | `data-mode="button"` + `data-label` — custom CTA                        |
| `custom-target.html`  | `data-target="#selector"` — mount into an existing element              |
| `badges/*.json`       | Demo OBv3 credential JSON files                                         |
| `capture-url.js`      | Displays the generated claim URL for inspection (also a test hook)      |

## E2E tests

Playwright assertions over each page verify:

- The one-line `<script>` tag actually renders a widget.
- The generated claim URL is well-formed (`/interactions/inline/`,
  `/interactions/inline-unsigned/`, or `/interactions/inline-src/`).
- `data-mode` controls whether a button and/or QR image appear.
- `data-target` places the widget into the right element.

```bash
pnpm --filter badge-claim-example exec playwright install --with-deps chromium
pnpm --filter badge-claim-example test:e2e
```

The tests boot `serve.js` automatically via Playwright's `webServer` config.

## End-to-end claim flow

Every demo's `data-src` points at a publicly-hosted fixture on
`https://learncard.app/demo-badges/*.json`. That makes the generated claim URL
fully round-trippable: scan the QR, the wallet hits brain-service, brain-service
fetches the fixture, signs (or wraps) the VC, and hands it back — no partner
hosting required.

The on-disk files in `badges/*.json` are mirrored from
`apps/learn-card-app/public/demo-badges/*.json` so the local demo server still
has them for offline work (swap `data-src` to `/badges/...` if you want to
exercise the SDK without any network).

## SDK behavior: relative `data-src`

When a partner pastes a relative path (`data-src="/badges/x.json"`), the SDK
resolves it against the embedding page's `window.location` before building
the claim URL. So `/badges/x.json` on `https://partner.com/event` becomes
`https://partner.com/badges/x.json` in the envelope. Full absolute URLs
(`data-src="https://..."`) are preserved verbatim.

## Pointing at a local LearnCard stack

By default the SDK builds URLs against `https://learncard.app`. To test against
a locally-running `learn-card-app` + `brain-service`:

1. Click the "Local" host switcher at the top of any demo page. This sets
   `data-host` to `http://localhost:8888` (Netlify dev).
2. Start the brain-service with `INLINE_SRC_DEV_MODE=1` so its SSRF guard
   accepts `http://`, `localhost`, and private IPs for local fixtures:

   ```bash
   INLINE_SRC_DEV_MODE=1 pnpm --filter @learncard/network-brain-service dev
   ```

   The server logs a loud warning per request while this flag is active.
   **Never set it in production** — it disables the SSRF policy that prevents
   partners (or attackers) from pointing brain-service at internal resources
   like `127.0.0.1`, RFC1918 addresses, or the cloud metadata endpoint at
   `169.254.169.254`.

3. Selecting Local automatically rewrites `data-src` for you. Each demo
   declares two sidecar attributes on its `.badge-claim-root` element:

   ```html
   <div class="badge-claim-root"
        data-src="https://learncard.app/demo-badges/accountability-signed.json"
        data-src-local="/badges/accountability-signed.json"
        ...>
   </div>
   ```

   The host switcher uses `data-src` for Production / Staging / VetPass, and
   swaps in `data-src-local` when Local is selected. The SDK's relative-URL
   absolutizer then resolves `/badges/...` against the page origin, so the
   full fetch → sign round-trip stays on `localhost:8899` + your local
   brain-service.

# LearnCard Embed SDK (MVP V1)

A tiny embed that lets partners add a “Claim Credential” experience to any page with a single script tag.

> **New: `badge-claim.js`** — if you already host your Open Badge / VC as a JSON file and just want a wallet-claimable button/QR, see the [Badge Claim one-liner](#badge-claim-one-liner) section below. No API keys, no OTP, no consent flow — just a link wallets can scan.

- Linear, secure flow: Email -> 6‑digit OTP -> Success with optional consent
- Ships as a single optimized JS file that exposes a global `LearnCard.init`
- Lightweight modal + iframe content with zero external dependencies for the consuming site

## Badge Claim One-Liner

For partners who already host their badge as JSON (the "Download JSON" pattern), `badge-claim.js` turns any badge into a wallet-scannable button / QR code with a single `<script>` tag. No API key, no backend, no JavaScript to write.

### Point at your hosted JSON

```html
<script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/badge-claim.js" async
        data-src="https://partner.com/badges/accountability.json"
        data-mode="both"></script>
```

This renders a "Claim Credential" button and a QR code. The QR encodes a LearnCard `/interactions/inline/<payload>?iuv=1` VCALM interaction URL; any VC-API-compatible wallet that scans it receives the credential. Works for **both signed and unsigned** credentials — the server auto-detects which you hosted.

### Signed vs unsigned: what the wallet sees

- **You host a signed VC** (your own issuer DID, your own proof). LearnCard wraps it in a VP and hands it to the wallet. Cryptographic issuer of record: **you**.
- **You host an unsigned VC template.** The wallet and server perform a DIDAuth round-trip to bind the credential to the holder's DID, then LearnCard signs with its own DID. Cryptographic issuer of record: **LearnCard**. Your original `issuer` field is preserved as `credentialSubject.awardedBy` so wallet UIs can display "Awarded by {you}, signed by LearnCard".

Unsigned credentials are **never** issued as unbound bearer tokens — the DIDAuth step guarantees the resulting VC is cryptographically bound to the claimer.

### Options

| Attribute      | Required | Default                 | Description                                               |
| -------------- | -------- | ----------------------- | --------------------------------------------------------- |
| `data-src`     | **yes**  | —                       | HTTPS URL to a hosted VC or Unsigned VC JSON file.        |
| `data-mode`    | no       | `both`                  | `button`, `qr`, or `both`.                                |
| `data-label`   | no       | `Claim Credential`      | Button label text.                                        |
| `data-target`  | no       | (auto-place)            | CSS selector of an existing element to mount into.        |
| `data-host`    | no       | `https://learncard.app` | LearnCard host (for staging, VetPass, self-hosted, etc.). |

### How it works

1. The script builds a URL of the form `https://learncard.app/interactions/inline/<base64url(src)>?iuv=1`.
2. When a wallet scans the QR or opens the link, the LearnCard edge function returns a VC-API protocol discovery response pointing at brain-service.
3. Brain-service decodes the payload: if it's an HTTPS URL we fetch the partner's JSON; if it's inline JSON we use it directly. Signed VCs are wrapped in a VP immediately; unsigned VCs trigger a DIDAuth exchange before signing.
4. The wallet stores the final bound credential.

### Security notes

- `data-src` hosts must be allowlisted server-side via the `INLINE_SRC_ALLOWED_HOSTS` env var (CSV of hostnames). Without an allowlist entry a partner integration will not work; contact LearnCard to get your domain added. A future phase will replace this with self-serve domain verification via `.well-known/learncard-partner.json`.
- Only HTTPS URLs are accepted. Redirects are rejected outright (`redirect: 'error'`) to prevent open-redirect bypass of the allowlist.
- Response `Content-Type` must be `application/json` or `application/ld+json`; size is capped at 64 KiB (streamed, not just content-length).
- Payloads are capped at 4096 chars (encoded URL) and 64 KiB (decoded JSON).

Note: By default, the SDK uses LearnCard Hosted Wallet APIs to send email OTP challenges, verify OTPs, and claim credentials when you provide a `publishableKey`. If `publishableKey` is not provided, the SDK falls back to a stubbed success flow for simple demos or offline UI development.

## Quick Start

```html
<!-- Load from CDN in production -->
<script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/learncard.js" defer></script>
<div id="claim-container"></div>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    LearnCard.init({
      partnerName: 'PartnerSite.com',
      target: '#claim-container',
      credential: { name: 'Python for Data Science' },
      // Enable real OTP + claim by providing your integration publishable key
      publishableKey: 'pk_live_xxx',
      // Optional: override API base (defaults to https://network.learncard.com/api)
      // apiBaseUrl: 'http://localhost:4000/api',
      requestBackgroundIssuance: true, // shows consent checkbox on success
      onSuccess: ({ credentialId, consentGiven }) => {
        console.log('Claim successful:', credentialId, 'consent:', consentGiven);
      },
      // Basic theming, or use branding tokens below
      theme: { primaryColor: '#1F51FF' },
      // branding: {
      //   primaryColor: '#1F51FF',
      //   accentColor: '#0F3BD9',
      //   logoUrl: 'https://cdn.learncard.com/logo.svg',
      //   partnerLogoUrl: 'https://your.site/logo.svg',
      //   walletUrl: 'https://learncard.app'
      // }
    });
  });
</script>
```

This renders a “Claim “Python for Data Science”” button. Clicking opens a LearnCard‑branded modal with email, OTP, and success steps. On success, the SDK opens `learncard.app` in a new tab and calls `onSuccess`.

## API

- `partnerName?: string` Optional label used in consent line and header branding.
- `target: string | HTMLElement` Required. Selector or element where the Claim button mounts.
- `credential: { name: string; [k: string]: unknown }` Required. Basic credential details for UI. `name` shows in the modal.
- `requestBackgroundIssuance?: boolean` If true, shows consent checkbox on success screen.
- `onSuccess?: (details: { credentialId: string; consentGiven: boolean }) => void` Called after success, right before closing the modal.
- `theme?: { primaryColor?: string }` Optional theming (back-compat). Prefer `branding` below.
- `branding?: { primaryColor?: string; accentColor?: string; logoUrl?: string; partnerLogoUrl?: string; walletUrl?: string }` Optional simple branding tokens.
- `publishableKey?: string` Optional. When provided, the SDK will call Hosted Wallet APIs for OTP + claim. When omitted, the SDK falls back to a stubbed success flow (useful for simple demos or UI testing).
- `apiBaseUrl?: string` Optional. Defaults to `https://network.learncard.com/api`. You can point to your self-hosted LearnCard Network (e.g., `http://localhost:4000/api`).

## Sessions, Accept Flow, and Logout

- When OTP verification succeeds, the SDK stores a short‑lived session token (`sessionJwt`) in `localStorage` under a key scoped by your `publishableKey`.
- If a session exists the next time the modal opens, the iframe renders an Accept screen that shows the stored email and an “Accept Credential” button. Clicking it directly calls the claim endpoint using the existing session (no need to re‑enter email or OTP).
- A “Use a different email” button logs out by clearing the stored session and returns you to the email entry screen.
- When viewing your LearnCard after success, the SDK opens the wallet URL with an auth handoff when a session exists:
  - Opens `(branding.walletUrl || 'https://learncard.app') + '/auth/handoff?token=' + encodeURIComponent(sessionJwt)`
  - Falls back to opening the base wallet URL when no session exists.

## Build

- `pnpm -w nx run embed-sdk:build`
- Output: `packages/learn-card-embed-sdk/dist/learncard.js` (IIFE for CDN) and `dist/learncard.esm.js` (ESM), plus `dist/index.d.ts`.

## Roadmap

- Replace inline iframe HTML with an Astro page + Preact Island for interactive fields as per architecture design.
- Expand hosted wallet API coverage and add more callbacks/hooks.
- Add multi-locale support and more partner branding controls.

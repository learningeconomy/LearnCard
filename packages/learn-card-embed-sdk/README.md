# LearnCard Embed SDK (MVP V1)

A tiny embed that lets partners add a “Claim Credential” experience to any page with a single script tag.

- Linear, secure flow: Email -> 6‑digit OTP -> Success with optional consent
- Ships as a single optimized JS file that exposes a global `LearnCard.init`
- Lightweight modal + iframe content with zero external dependencies for the consuming site

Note: By default, the SDK uses LearnCard Hosted Wallet APIs to send email OTP challenges, verify OTPs, and claim credentials when you provide a `publishableKey`. If `publishableKey` is not provided, the SDK falls back to a stubbed success flow for simple demos or offline UI development.

## Quick Start

```html
<!-- Load from CDN in production -->
<script src="https://cdn.learncard.com/sdk/v1/learncard.js" defer></script>
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

## Build

- `pnpm -w nx run embed-sdk:build`
- Output: `packages/learn-card-embed-sdk/dist/learncard.js` (IIFE for CDN) and `dist/learncard.esm.js` (ESM), plus `dist/index.d.ts`.

## Roadmap

- Replace inline iframe HTML with an Astro page + Preact Island for interactive fields as per architecture design.
- Expand hosted wallet API coverage and add more callbacks/hooks.
- Add multi-locale support and more partner branding controls.

# LearnCard Embed SDK (MVP V1)

A tiny embed that lets partners add a “Claim Credential” experience to any page with a single script tag.

- Linear, secure flow: Email -> 6‑digit OTP -> Success with optional consent
- Ships as a single optimized JS file that exposes a global `LearnCard.init`
- Lightweight modal + iframe content with zero external dependencies for the consuming site

Note: This MVP stubs OTP verification/issuance for UI/flow validation. Real OTP + issuance will connect to LearnCard Hosted Wallet services.

## Quick Start

```html
<!-- Load from CDN in production -->
<script src="https://cdn.learncard.com/sdk/v1/learncard.js" defer></script>
<div id="claim-container"></div>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    LearnCard.init({
      partnerId: 'partner_abc123',
      partnerName: 'PartnerSite.com',
      target: '#claim-container',
      credential: { name: 'Python for Data Science' },
      requestBackgroundIssuance: true, // shows consent checkbox on success
      onSuccess: ({ credentialId, consentGiven }) => {
        console.log('Claim successful:', credentialId, 'consent:', consentGiven);
      },
      theme: { primaryColor: '#1F51FF' }
    });
  });
</script>
```

This renders a “Claim “Python for Data Science”” button. Clicking opens a LearnCard‑branded modal with email, OTP, and success steps. On success, the SDK opens `learncard.app` in a new tab and calls `onSuccess`.

## API

- `partnerId: string` Required. Your Partner ID.
- `partnerName?: string` Optional label used in consent line.
- `target: string | HTMLElement` Required. Selector or element where the Claim button mounts.
- `credential: { name: string; [k: string]: unknown }` Required. Basic credential details for UI. `name` shows in the modal.
- `requestBackgroundIssuance?: boolean` If true, shows consent checkbox on success screen.
- `onSuccess?: (details: { credentialId: string; consentGiven: boolean }) => void` Called after success, right before closing the modal.
- `theme?: { primaryColor?: string }` Optional theming.

## Build

- `pnpm -w nx run embed-sdk:build`
- Output: `packages/learn-card-embed-sdk/dist/learncard.js` (IIFE for CDN) and `dist/learncard.esm.js` (ESM), plus `dist/index.d.ts`.

## Roadmap

- Replace inline iframe HTML with an Astro page + Preact Island for interactive fields as per architecture design.
- Integrate Hosted Wallet APIs for email OTP and issuance.
- Add multi-locale support and partner branding tokens (logo, accent color, legal copy).

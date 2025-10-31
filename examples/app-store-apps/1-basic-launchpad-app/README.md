# LearnCard App Store Demo: Basic Launchpad App

This is a demonstration application showing how to build an embeddable web page for the LearnCard app store. It showcases the core postMessage-based communication protocol for:

- **SSO/Identity**: Authenticating users via `REQUEST_IDENTITY`
- **Issuing Credentials**: Sending credentials to the user's wallet via `SEND_CREDENTIAL`
- **Launching Features**: Opening LearnCard features (e.g., AI Tutor) via `LAUNCH_FEATURE`
- **Requesting Credentials**: Asking users to share credentials via `ASK_CREDENTIAL_SEARCH`

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Integration Notes

- Update `LEARNCARD_HOST_ORIGIN` to match your production LearnCard host domain
- The demo uses the `LEARNCARD_V1` postMessage protocol
- All postMessage communication is origin-verified for security
- SSO tokens should be validated on your backend before creating sessions

## Features Demonstrated

1. **Single Sign-On (SSO)**: User identity via JWT token
2. **Credential Issuance**: Issue credentials with user consent
3. **Feature Launch**: Trigger LearnCard features from your app
4. **Credential Request**: Request credentials with search criteria

## Architecture

- Built with Astro for fast, static site generation
- Uses Tailwind CSS via CDN for styling
- Client-side postMessage handlers for LearnCard communication
- Promise-based API for async request/response flows

# LearnCard App Store Demo: Basic Launchpad App

This is a demonstration application showing how to build an embeddable web page for the LearnCard app store. It showcases the Partner Connect SDK including:

- **SSO/Identity**: Authenticating users via `requestIdentity()`
- **Issuing Credentials**: Sending credentials to the user's wallet via `sendCredential()`
- **Launching Features**: Opening LearnCard features (e.g., AI Tutor) via `launchFeature()`
- **Requesting Credentials**: Asking users to share credentials via `askCredentialSearch()`
- **App Notifications**: Sending in-app notifications via `sendNotification()`
- **App Counters**: Incrementing and reading per-user counters via `incrementCounter()`, `getCounter()`, `getCounters()`

## Quick Start (Full Local Testing)

### 1. Start infrastructure

```bash
# From the repo root — start Neo4j + Redis
docker compose up neo4j redis -d
```

### 2. Build the SDK (if you've changed it)

```bash
pnpm nx run partner-connect-sdk:build
```

### 3. Seed a dev app in the brain-service DB

```bash
cd services/learn-card-network/brain-service

# Create a .env with NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
# Then seed (idempotent — safe to re-run):
pnpm seed:dev-app --app-url http://localhost:4321

# Or with custom options:
pnpm seed:dev-app \
  --app-url http://localhost:4321 \
  --app-name "My Test App" \
  --profile dev-owner \
  --install-for test-user
```

The script prints a `LISTING_ID` you can use in your app's `.env`.

### 4. Start the brain-service

```bash
cd services/learn-card-network/brain-service
pnpm start
```

### 5. Start this example app

```bash
cd examples/app-store-apps/1-basic-launchpad-app
cp .env.example .env   # edit with your values
pnpm dev
```

## Getting Started (Standalone)

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
5. **App Notifications**: Send notifications to the current user's inbox
6. **App Counters**: Increment, read, and list per-user/per-app counters

## Architecture

- Built with Astro for fast, static site generation
- Uses Tailwind CSS via CDN for styling
- Client-side Partner Connect SDK for LearnCard communication
- Promise-based API for async request/response flows

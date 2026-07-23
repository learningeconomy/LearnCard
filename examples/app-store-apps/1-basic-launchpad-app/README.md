# LearnCard App Store Demo: Basic Launchpad App

This is a demonstration application showing how to build an embeddable web page for the LearnCard app store. It showcases the newest zero-config Partner Connect SDK flows including:

-   **SSO/Identity**: Authenticating users via `requestIdentity()`
-   **Inline Credential Templates**: Sending credentials with `sendCredential({ alias, template, templateData })`
-   **Offline Template Validation**: Validating inline templates locally with `validateCredentialTemplate()`
-   **Scoped Consent**: Requesting permissions with `requestConsent({ read, reason })`
-   **Launching Features**: Opening LearnCard features (e.g., AI Tutor) via `launchFeature()`
-   **Requesting Credentials**: Asking users to share credentials via `askCredentialSearch()`
-   **Learner Context**: Reading learner context via `requestLearnerContext()`
-   **App Notifications**: Sending in-app notifications via `sendNotification()`
-   **App Counters**: Incrementing and reading per-user counters via `incrementCounter()`, `getCounter()`, `getCounters()`
-   **Publish Flow**: Inspecting `getCapturedManifest()` and `getPublishUrl()` in mock mode

## Quick Start (Full Local Testing)

### 1. Start infrastructure

```bash
# From the repo root — start Neo4j + Redis
docker compose up neo4j redis -d
```

### 2. Build the SDK (if you've changed it)

```bash
bunx nx run partner-connect-sdk:build
```

### 3. Seed a dev app in the brain-service DB

```bash
cd services/learn-card-network/brain-service

# Create a .env with NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
# Then seed (idempotent — safe to re-run):
bun run seed:dev-app --app-url http://localhost:4321

# Or with custom options:
bun run seed:dev-app \
  --app-url http://localhost:4321 \
  --app-name "My Test App" \
  --profile dev-owner \
  --install-for test-user
```

The script prints a `LISTING_ID` you can use in your app's `.env`.

### 4. Start the brain-service

```bash
cd services/learn-card-network/brain-service
bun run start
```

### 5. Start this example app

```bash
cd examples/app-store-apps/1-basic-launchpad-app
cp .env.example .env   # edit with your values
bun run dev
```

## Getting Started (Standalone)

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Integration Notes

-   No pre-created contract URI or boost URI is required for the happy path
-   Standalone local development auto-uses SDK mock mode, so the demo works without embedding
-   When embedded or previewed inside LearnCard, the same calls use the real host automatically
-   The optional boost URI field is only for inspecting an existing host boost/template
-   All postMessage communication is origin-verified for security
-   SSO tokens should be validated on your backend before creating sessions

## Features Demonstrated

1. **Single Sign-On (SSO)**: User identity via JWT token
2. **Inline Template Credential Issuance**: Zero-config credential creation, validation, issuance, status, and recipients
3. **Scoped Consent**: Declarative consent flow without a contract URI
4. **Feature Launch**: Trigger LearnCard features from your app
5. **Credential Request**: Request credentials with search criteria
6. **Learner Context**: Inspect a structured learner-context response
7. **App Notifications**: Send notifications to the current user's inbox
8. **App Counters**: Increment, read, and list per-user/per-app counters
9. **Publish**: Preview the mock-captured manifest and publish URL

## Architecture

-   Built with Astro for fast, static site generation
-   Uses Tailwind CSS via CDN for styling
-   Client-side Partner Connect SDK for LearnCard communication
-   Promise-based API for async request/response flows

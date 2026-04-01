# ConsentFlow Test App

A standalone test harness for the LearnCard ConsentFlow redirect integration. Lets you test the full consent → callback → send credential flow without building a real backend.

## Quick Start

```bash
cd examples/consent-flow-test
pnpm install
node server.js
```

Open http://localhost:8899

## What It Does

This app simulates what a partner's website does when integrating with LearnCard's ConsentFlow:

1. **Redirect** — Sends the user to LearnCard's consent screen (`/consent-flow?uri=...&returnTo=...`)
2. **Callback** — Receives the user back with `did` and `vp` query parameters
3. **Send** — Uses the LearnCard SDK (server-side) to issue a credential to the consented user

## Setup

### Prerequisites

- LearnCard app running locally (default: `http://localhost:3000`)
- Brain service running locally (default: `http://localhost:4000/trpc`) — or use production
- A ConsentFlow contract URI (create one in the developer portal)
- A credential template/boost URI
- An issuer seed (64-character hex string)

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| **Environment** | Yes | Where LearnCard is running. Use "Local Dev" for `localhost:3000` |
| **Contract URI** | Yes | The consent contract URI from the developer portal (e.g. `lc:contract:...`) |
| **Callback URL** | Auto | Pre-filled with the test app's URL. This is where users return after consent |
| **Issuer Seed** | For send | Your 64-char hex seed. Used server-side to initialize LearnCard and sign credentials |
| **Template URI** | For send | The credential template to issue (e.g. `lc:boost:...`) |
| **Integration ID** | Optional | UUID for dashboard activity tracking |
| **Network URL** | Optional | Override the network endpoint (e.g. `http://localhost:4000/trpc` for local dev) |

All fields are persisted to `localStorage` so you don't have to re-enter them between tests.

## Usage

### Step 1: Test Your Connection

Enter your issuer seed and click **Test LearnCard Init**. This initializes the SDK server-side and returns your issuer DID. If this works, your seed and network config are correct.

### Step 2: Launch Consent Flow

Enter a contract URI and click **Open Consent Flow**. This redirects you to LearnCard where you (or a test user) can grant consent. After consenting, LearnCard redirects back to this app with:

- `did` — the user's decentralized identifier
- `vp` — a Verifiable Presentation JWT proving consent

### Step 3: Send a Credential

After the callback, the send form is pre-filled with the user's DID and your saved config. Click **Send Credential** to issue the credential via `learnCard.invoke.send()`.

The app also shows:
- Decoded VP JWT payload
- The equivalent TypeScript code for your own backend

## Architecture

```
Browser (index.html)          Node Server (server.js)
┌──────────────────┐          ┌─────────────────────┐
│ Configure form   │          │ Express on :8899     │
│ Launch redirect  │──────>   │                     │
│                  │  LearnCard│                     │
│ Callback display │<──────   │                     │
│ Send form        │─POST──>  │ POST /api/init      │
│                  │          │   initLearnCard()   │
│                  │─POST──>  │ POST /api/send      │
│                  │          │   wallet.invoke.send │
└──────────────────┘          └─────────────────────┘
```

The server is needed because `@learncard/init` requires Node.js (crypto, DID resolution). The browser handles UI and the consent redirect flow. This mirrors a real integration where your backend calls the LearnCard SDK.

## API Endpoints

### `POST /api/init`

Test wallet initialization.

```json
{
  "seed": "abcdef0123456789...",
  "networkUrl": "http://localhost:4000/trpc"
}
```

Returns: `{ "success": true, "did": "did:key:z6Mk..." }`

### `POST /api/send`

Send a credential to a user.

```json
{
  "seed": "abcdef0123456789...",
  "recipient": "did:web:...",
  "contractUri": "lc:contract:...",
  "templateUri": "lc:boost:...",
  "integrationId": "uuid",
  "networkUrl": "http://localhost:4000/trpc"
}
```

Returns: `{ "success": true, "result": { ... }, "issuerDid": "did:key:..." }`

## Local Dev Example

For a typical local development setup:

1. Start LearnCard app on `localhost:3000`
2. Start brain-service on `localhost:4000`
3. Run this test app:

```bash
node server.js
```

4. In the browser at `http://localhost:8899`:
   - Environment: **Local Dev (localhost:3000)**
   - Network URL: `http://localhost:4000/trpc`
   - Contract URI: paste from developer portal
   - Template URI: paste from developer portal
   - Issuer Seed: your test seed
   - Integration ID: from the developer portal integration

5. Click **Test LearnCard Init** to verify
6. Click **Open Consent Flow** to start the test
7. Consent in the LearnCard app
8. Back on this page, click **Send Credential**
9. Check the user's LearnCard wallet for the credential

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Key must be a hexadecimal string" | Seed must be exactly 64 hex characters |
| Init works but send fails with auth error | Make sure the seed's DID has a profile on the network |
| Consent flow shows "Loading..." forever | Check that brain-service is running and the contract URI is valid |
| Redirect goes to blank page | Verify the LearnCard app is running at the selected environment URL |
| "Failed to connect to server" | Run `node server.js` first |

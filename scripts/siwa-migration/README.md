# Sign in with Apple Migration Script

Migrates Sign in with Apple (SIWA) user identities when transferring the LearnCard app between Apple Developer teams.

**Why:** Apple's `sub` (subject identifier) is team-scoped. When the app transfers from WeLibrary (`AW9L6U5B2L`) to Learning Economy (`5JB5D53PRR`), every SIWA user gets a new `sub`. Without migration, Firebase creates duplicate accounts and users lose access to their existing identity (Web3Auth key → DID → all credentials).

## Prerequisites

- **Firebase service account JSON** — Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- **Old team SIWA private key (`.p8`)** — Apple Developer Portal (WeLibrary) → Keys → Sign in with Apple key
- **New team SIWA private key (`.p8`)** — Apple Developer Portal (Learning Economy) → Keys → Sign in with Apple key
- **Node.js 20+** and **npm/pnpm**

## Setup

```bash
cd scripts/siwa-migration
npm install
```

## Usage

### Step 1: Pre-Transfer (run BEFORE initiating the app transfer)

Uses the **old team's** (WeLibrary) Apple credentials to generate transfer identifiers.

```bash
npx tsx migrate.ts pre-transfer \
  --firebase-credential ./service-account.json \
  --apple-key ./old-team-siwa.p8 \
  --apple-key-id <OLD_KEY_ID> \
  --apple-team-id AW9L6U5B2L \
  --apple-client-id com.learncard.app \
  --target-team-id 5JB5D53PRR
```

This exports all SIWA users from Firebase and calls Apple's API to get a `transfer_sub` for each. Output is saved to `migration-data/`.

### Step 2: Transfer the App

Initiate and accept the transfer in App Store Connect. This happens outside this script.

### Step 3: Post-Transfer (run AFTER the transfer is accepted, BEFORE releasing the new app version)

Uses the **new team's** (Learning Economy) Apple credentials to exchange transfer identifiers for new subs and update Firebase Auth.

```bash
# Preview first (recommended)
npx tsx migrate.ts post-transfer \
  --firebase-credential ./service-account.json \
  --apple-key ./new-team-siwa.p8 \
  --apple-key-id <NEW_KEY_ID> \
  --apple-team-id 5JB5D53PRR \
  --apple-client-id com.learncard.app \
  --target-team-id AW9L6U5B2L \
  --dry-run

# Execute the migration
npx tsx migrate.ts post-transfer \
  --firebase-credential ./service-account.json \
  --apple-key ./new-team-siwa.p8 \
  --apple-key-id <NEW_KEY_ID> \
  --apple-team-id 5JB5D53PRR \
  --apple-client-id com.learncard.app \
  --target-team-id AW9L6U5B2L
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--data-dir <path>` | `./migration-data` | Directory for intermediate JSON files |
| `--dry-run` | `false` | (post-transfer only) Preview without modifying Firebase |
| `--batch-delay <ms>` | `200` | (post-transfer only) Delay between Firebase operations |

## How It Works

1. **Pre-transfer** lists all Firebase users with `apple.com` provider, then calls Apple's `/auth/usermigrationinfo` endpoint with each user's `sub` to get a `transfer_sub`.

2. **Post-transfer** exchanges each `transfer_sub` for the user's new `sub` under the new team, then updates Firebase Auth using a delete-and-reimport strategy:
   - Snapshots the full user record (email, phone, claims, all providers)
   - Deletes the user
   - Re-imports with the **same Firebase UID** but updated `apple.com` provider UID
   - Restores custom claims

The Firebase UID is preserved, which is critical because it's the `verifierId` for Web3Auth SFA — changing it would change the user's derived private key, DID, and all associated data.

## Safety

- **Idempotent** — Re-running `post-transfer` skips already-migrated users
- **Retries** — Apple API rate limits (HTTP 429) are retried with exponential backoff
- **Audit trail** — Every operation is logged to `migration-data/migration-log.json`
- **Dry run** — Preview the full migration without modifying Firebase
- **Per-user isolation** — A failure on one user doesn't abort the batch

## Files Generated

| File | Created By | Description |
|------|-----------|-------------|
| `migration-data/users-export.json` | pre-transfer | All Firebase users with apple.com provider |
| `migration-data/transfer-ids.json` | pre-transfer | Users + their Apple transfer identifiers |
| `migration-data/final-mapping.json` | post-transfer | Full mapping: old sub → transfer sub → new sub |
| `migration-data/migration-log.json` | post-transfer | Per-user migration results with timestamps |

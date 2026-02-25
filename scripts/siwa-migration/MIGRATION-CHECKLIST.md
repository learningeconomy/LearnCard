# LearnCard App Transfer Checklist

Full ordered timeline for transferring `learn-card-app` from **WeLibrary, LLC** (`AW9L6U5B2L`) to **Learning Economy, Inc.** (`5JB5D53PRR`) on Apple App Store and Google Play.

---

## Phase 0: Gather Credentials (Week -2)

### Apple (Learning Economy)

- [ ] Log into [Apple Developer Portal](https://developer.apple.com) as Learning Economy
- [ ] Note the **Team ID**: `5JB5D53PRR`
- [ ] Note the **App Store Connect Team ID** (ITC Team ID) — found in ASC → Users & Access
- [ ] Note the **Account Holder Apple ID** email
- [ ] Generate a new **Sign in with Apple key** (`.p8`) — Keys → + → Sign in with Apple
  - Save the **Key ID** and download the `.p8` file
- [ ] Generate a new **APNs key** (`.p8`) — Keys → + → Apple Push Notifications service
  - Save the **Key ID** and download the `.p8` file (can be same key as SIWA if you enable both capabilities)
- [ ] Generate a new **App Store Connect API key** — ASC → Users & Access → Integrations → App Store Connect API
  - Save **Key ID**, **Issuer ID**, and download the `.p8` file
- [ ] Generate an **App-Specific Password** for the Learning Economy Apple ID — [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords

### Apple (WeLibrary)

- [ ] Log into [Apple Developer Portal](https://developer.apple.com) as WeLibrary
- [ ] Locate the existing **Sign in with Apple key** (`.p8`) — or generate a new one if lost
  - Save the **Key ID** and ensure you have the `.p8` file
- [ ] Note the **Account Holder Apple ID** email

### Google Play (Learning Economy)

- [ ] Log into [Google Play Console](https://play.google.com/console) as Learning Economy
- [ ] Create a **Service Account** for API access — Setup → API access → Create new service account
  - Download the service account JSON key file
  - Grant it **Release Manager** permissions on the LearnCard app (after transfer)

### Google Play (WeLibrary)

- [ ] Export the existing **Transaction ID** (for transferring subscription/purchase history, if any — LearnCard has no IAP, so this may be N/A)

### Android Keystore

- [ ] Export the `.keystore` or `.jks` file used to sign the Android app
  - Currently stored as base64 in GitHub secret `KEYSTORE_FILE`
  - Decode and verify: `echo "$KEYSTORE_FILE_BASE64" | base64 -d > learncard.keystore`
- [ ] Document the **keystore password**, **key alias**, and **key password**
- [ ] Verify the keystore works: `keytool -list -v -keystore learncard.keystore -alias <alias>`

### Firebase

- [ ] Download a **Firebase service account JSON** — [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts → Generate New Private Key
  - This is for the `learncard` project (shared, no change needed)

### CapGo

- [ ] Verify `CAPGO_TOKEN` will continue to work, or generate a new token from [CapGo dashboard](https://capgo.app)

---

## Phase 1: Pre-Transfer Preparation (Week -1)

### Run SIWA Pre-Transfer Script

- [ ] Place the WeLibrary SIWA `.p8` key and Firebase service account JSON in `scripts/siwa-migration/`
- [ ] Run the pre-transfer export:
  ```bash
  cd scripts/siwa-migration
  npm install
  npx tsx migrate.ts pre-transfer \
    --firebase-credential ./service-account.json \
    --apple-key ./welibrary-siwa.p8 \
    --apple-key-id <WELIBRARY_KEY_ID> \
    --apple-team-id AW9L6U5B2L \
    --apple-client-id com.learncard.app \
    --target-team-id 5JB5D53PRR
  ```
- [ ] Verify `migration-data/transfer-ids.json` was created and contains all Apple users
- [ ] Back up `migration-data/` to a secure location

### Prepare the Code PR

The code changes are already implemented on the branch (team ID + AASA updates). Confirm:

- [ ] `project.pbxproj` has `DEVELOPMENT_TEAM = 5JB5D53PRR` (3 occurrences)
- [ ] `apple-app-site-association` has `"appID": "5JB5D53PRR.com.learncard.app"`
- [ ] PR is reviewed and approved — **do NOT merge yet**

### Prepare GitHub Environment Variables

Draft the new values (do NOT apply yet):

| Variable | New Value |
|----------|-----------|
| `TEAM_ID` | `5JB5D53PRR` |
| `TEAM_NAME` | `Learning Economy, Inc.` |
| `ITC_TEAM_ID` | *(from Phase 0)* |
| `APPLE_ID` | *(Learning Economy Apple ID)* |
| `APP_STORE_CONNECT_KEY_ID` | *(from Phase 0)* |
| `APP_STORE_CONNECT_ISSUER_ID` | *(from Phase 0)* |
| `APP_STORE_CONNECT_KEY_CONTENT` | *(base64 of ASC API key .p8)* |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | *(from Phase 0)* |
| `MATCH_PASSWORD` | *(keep existing — same cert repo)* |
| `MATCH_GIT_DEPLOY_KEY` | *(keep existing — same cert repo)* |
| `MATCH_GIT_BRANCH` | `learning-economy` *(new branch for LE certs)* |
| `JSON_KEY_DATA` | *(new Google Play service account JSON)* |

Android secrets remain unchanged:
- `KEYSTORE_FILE` — same keystore
- `ANDROID_KEYSTORE_PASSWORD` — same
- `ANDROID_KEYSTORE_KEY_ALIAS` — same
- `ANDROID_KEYSTORE_KEY_PASSWORD` — same

### Communication Prep

- [ ] Draft user email: "LearnCard is updating — you may need to sign in again after updating"
- [ ] Draft push notification message (shorter version)

---

## Phase 2: Transfer Day (Day 0)

### Morning — Initiate Transfer

- [ ] **[WeLibrary]** App Store Connect → My Apps → LearnCard → App Information → Transfer App
  - Enter Learning Economy's **Apple ID** and **Team ID** (`5JB5D53PRR`)
- [ ] **[Learning Economy]** Accept the transfer in App Store Connect
- [ ] **[WeLibrary]** Google Play Console → All apps → LearnCard → Transfer app
  - Enter Learning Economy's **developer account ID**
- [ ] **[Learning Economy]** Accept the transfer in Google Play Console

### Within 1 Hour — Critical Service Fixes

- [ ] **Push Notifications:** Firebase Console → Project Settings → Cloud Messaging → Upload the new APNs key (`.p8`) from Learning Economy
  - Remove the old WeLibrary APNs key (if it stops working)
- [ ] **Merge the code PR** (team ID + AASA changes) → triggers Netlify deploy
  - Verify AASA is live: `curl -s https://learncard.app/.well-known/apple-app-site-association | jq .`
  - Should show `5JB5D53PRR.com.learncard.app`

### Afternoon — CI/CD Reconfiguration

- [ ] Update all **GitHub Environment variables and secrets** per the table above
- [ ] Run Fastlane certificate setup:
  ```bash
  # Nuke old certs (WeLibrary team) from the match repo
  fastlane match nuke development
  fastlane match nuke appstore

  # Generate new certs (Learning Economy team) — will use updated TEAM_ID
  fastlane match appstore
  fastlane match development
  ```
- [ ] **Do NOT submit a new app version to the stores yet**

---

## Phase 3: Internal Testing (Day 1 – Day 13)

### Build Verification

- [ ] Trigger a CI build with the new certificates
- [ ] Upload the iOS build to **TestFlight** (internal group only)
- [ ] Upload the Android build to **Google Play internal testing track**
- [ ] Install the new build **over** the old app on a test device — verify it upgrades cleanly

### Functional Testing

- [ ] **Sign in with Apple** — Sign out, sign back in, verify same account
- [ ] **Google Sign-In** — Sign out, sign back in, verify same account
- [ ] **Phone number login** — Test OTP flow
- [ ] **Email login** — Test verification code flow
- [ ] **Push Notifications** — Send a test notification via Firebase Console, verify delivery on iOS and Android
- [ ] **Universal Links** — Tap a `https://learncard.app/...` link on iOS, verify it opens the app
- [ ] **Deep Links** — Test `dccrequest://`, `msprequest://` schemes
- [ ] **CapGo OTA** — Verify the app receives OTA updates from CapGo
- [ ] **Web3Auth / Wallet** — Verify the user's DID and credentials are intact after login
- [ ] **Profile & Credentials** — Verify user can view their profile, credentials, and boosts

### Day 7 — User Communication

- [ ] Send email blast to all users warning of upcoming update and potential re-login
- [ ] Send push notification with the same message

---

## Phase 4: Release Day (Day 14)

### 09:00 AM — Submit Builds

- [ ] **iOS:** Submit new version to App Store Review → select **"Manually release this version"**
- [ ] **Android:** Promote build from internal testing → production (staged rollout recommended)

### Wait for Apple Review

- [ ] Monitor App Store Connect for review status
- [ ] Expected: 1-3 business days for review

### When Apple Says "Ready for Sale" — Execute Migration

**This is the critical window. Steps must be executed in order.**

1. **Run SIWA post-transfer migration (dry run first):**
   ```bash
   cd scripts/siwa-migration
   npx tsx migrate.ts post-transfer \
     --firebase-credential ./service-account.json \
     --apple-key ./learning-economy-siwa.p8 \
     --apple-key-id <LE_KEY_ID> \
     --apple-team-id 5JB5D53PRR \
     --apple-client-id com.learncard.app \
     --target-team-id AW9L6U5B2L \
     --dry-run
   ```
   - [ ] Review the dry-run output — verify user count matches pre-transfer export

2. **Run SIWA post-transfer migration (for real):**
   ```bash
   npx tsx migrate.ts post-transfer \
     --firebase-credential ./service-account.json \
     --apple-key ./learning-economy-siwa.p8 \
     --apple-key-id <LE_KEY_ID> \
     --apple-team-id 5JB5D53PRR \
     --apple-client-id com.learncard.app \
     --target-team-id AW9L6U5B2L
   ```
   - [ ] Verify output: `X succeeded, 0 failed`

3. **Validate the migration:**
   ```bash
   npx tsx migrate.ts validate \
     --firebase-credential ./service-account.json
   ```
   - [ ] Verify output: `✅ All users migrated successfully.`

4. **Release the app:**
   - [ ] App Store Connect → Click **"Release This Version"**
   - [ ] Google Play → Confirm production release (if not already live)

5. **Send final communications:**
   - [ ] Email: "LearnCard has been updated — please update your app. You may need to sign in again."
   - [ ] Push notification: same message (reaches users who haven't updated yet)

---

## Phase 5: Post-Release Monitoring (Day 15+)

### Day 15-16 — Active Monitoring

- [ ] Monitor **Firebase Auth** for unexpected new account creations (indicates migration miss)
- [ ] Monitor **Crashlytics / error logs** for auth failures
- [ ] Monitor **App Store Connect** and **Google Play Console** for review complaints or crashes
- [ ] Spot-check: sign in with Apple on a fresh device, verify it resolves to an existing account

### Day 17+ — Cleanup

- [ ] Re-invite **external TestFlight testers** (they were wiped during the transfer)
- [ ] Revoke old WeLibrary **certificates and provisioning profiles** from the Match repo
- [ ] Remove old WeLibrary **APNs key** from Firebase Console (if not already done)
- [ ] Delete the old WeLibrary **SIWA key** from Apple Developer Portal (optional, for hygiene)
- [ ] Delete sensitive files from `scripts/siwa-migration/` (`.p8` keys, service account JSON)
  - These are `.gitignore`d but verify they weren't committed
- [ ] (Optional) Rename Docker images from `welibrary/*` to `learningeconomy/*`

---

## Quick Reference

| Item | Old (WeLibrary) | New (Learning Economy) |
|------|-----------------|----------------------|
| Apple Team ID | `AW9L6U5B2L` | `5JB5D53PRR` |
| Bundle ID | `com.learncard.app` | `com.learncard.app` *(unchanged)* |
| Firebase Project | `learncard` | `learncard` *(unchanged)* |
| Android Keystore | same `.jks` | same `.jks` *(unchanged)* |
| Fastlane Match Repo | `WeLibraryOS/certificates` | `WeLibraryOS/certificates` *(unchanged)* |
| AASA appID | `AW9L6U5B2L.com.learncard.app` | `5JB5D53PRR.com.learncard.app` |
| ASC API Key | WeLibrary key | New LE key |
| APNs Key | WeLibrary key | New LE key |
| Google Play Service Account | WeLibrary SA | New LE SA |

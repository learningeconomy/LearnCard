# App store (with a real Partner Connect app)

The app store lists partner apps. Visitors who choose **Get** are asked to sign in; signed-in learners browse, read a detail page, consent to the app's permissions, install it (persisted on the network and across reloads), and open it embedded, where the real partner app gets the learner's identity over Partner Connect.

## Sub-features

- `apps-public-sign-in-intent`: signed out, `/app/<listingId>` → **Get**/**Install** → `Sign in to continue` → **Continue** → `/login`, which shows that you'll be taken back to the app.
- `apps-browse-detail`: Apps → **Browse More** → `/launchpad/browse?tab=All` → the listing row → **Get** opens the detail (`#right-modal`) with **About** and **Install**.
- `apps-install-persist-launch`: **Install** → `Install App` consent showing **Request Identity** → **Install** → the detail shows **Open** → immediate reload, without waiting for the list/cache persister → learner SDK confirms that exact listing is installed and the reloaded list still shows **Open**. **Open** embeds the real example; its **Request Identity** click must produce a matching host response containing the learner's DID and a nonempty JWT. The existing DIDKit verifier must validate its signature, the click's challenge, and the partner app's audience against the local stack.

## How to get to it (user POV)

- Sidebar **Apps** (`/launchpad`) → **Browse More**.
- A shared listing link: `/app/<listingId>`.

## Driving it with lc verify

Preconditions:

- Doctor ok. The stack's allocated partner port is free; no other `app-store` journey uses this directory concurrently. Repo Node 24.12–24.x is first on PATH or set via `LC_VERIFY_NODE`. `node_modules` matches `bun.lock` (`bun install --frozen-lockfile`).
- The journey starts `examples/app-store-apps/1-basic-launchpad-app` with Astro's `dev()` API at `v.stack.partner` (logs in `app-store-app.log`), using an allowlisted environment, disposable issuer seed, and explicit local Brain/LearnCloud URLs. Its child process is ownership-registered so `down` can recover a crashed runner. It seeds a published listing with `services/learn-card-network/brain-service/scripts/seed-dev-app.ts` (`app-store-seed.log`, `app-store-listing.json`). The listing is **not** preinstalled.

- **Run.** `$LCV run app-store --dir /tmp/lcv` (set `LC_VERIFY_NODE=/path/to/node24` if needed). A pass requires `installedConfirmedByLearnerSdk: true`, `identityRequestResponseMatched: true`, and `identityTokenCryptographicallyVerified: true`; the banner alone is not proof.
- **Public intent.** A new context opens `/app/<listingId>`; the display name is visible; `getByRole('button', { name: /^(get app|install)$/i })` → `Sign in to continue` → **Continue** → `/login` with "taken back to … <name>".
- **Browse and detail.** Signed in: `/launchpad` → `getByRole('button', { name: /browse more/i })` → `ion-item` with the name → **Get** → `#right-modal` shows the name, **About** and **Install**.
- **Install.** The learner SDK first confirms that the listing is not installed. **Install** → heading `Install App`, `Request Identity`, then the last **Install** → the detail shows **Open** → immediately reload. No fixed sleep, list refetch wait, or pre-reload navigation is allowed. The learner SDK's `isAppInstalled(listingId)` must return true (`apps-installed-sdk.json`), the reloaded row must show **Open**, and reopening the detail via **More options** must show **Open** and no **Install**.
- **Launch and identity.** **Open** → `iframe[title^="<name> - "]` with `src` origin matching `v.stack.partner` → the frame heading is `LearnCard Partner App Demo`. After bootstrap finishes, passive message listeners observe the explicit **Request Identity** click: the request must come from that iframe and the response from its parent host, with exact origins, `LEARNCARD_V1`, and the same request ID. The response must be `SUCCESS`, contain the expected learner DID, and carry a nonempty JWT. Its issuer/VP holder must match that learner, its nonce must match the observed request challenge, and its audience must be the run-owned partner origin. A separate actor's local-stack SDK runs `verifyPresentation` with JWT/authentication options: no warnings/errors and a `JWS` check are required.
- **Partner backend issuance.** Invoke the real embedded app's Astro `actions.issueCredential` client for the signed-in learner. The returned credential must name the run's disposable partner issuer and that exact learner; a separate local-stack SDK verifies its cryptographic proof. `apps-partner-server-issuance.json` records issuer, recipient and checks, and the report requires `partnerServerCredentialVerified: true`. This is the example's public server action, not a substitute SDK issuance.
- **Evidence.** `apps-identity-verification.json` and the report contain only nonsecret identity/check metadata, never the token. The example's `JWT received` text does not validate token presence or signature. Raw browser traces/session artifacts remain private.
- **Additional corroboration (optional).** `$LCV db --dir /tmp/lcv neo4j "MATCH (p:Profile)-[:INSTALLS]->(l:AppStoreListing) RETURN p.profileId, l.display_name"`.

## Gotchas

- `bun.lock` once pinned astro's `zod` to 3.25.76 through a stale `"astro>zod"` override, so Astro 7 crashed with `z.function(...).optional is not a function`. If that error reappears, check root `package.json` overrides.
- Astro 7 refuses Node < 22.12 with `Node.js v20… is not supported by Astro!`.
- The example signs immediately after initialization, using its `did:key`. A verifier wallet that already loaded a network profile can default to `did:web`; derive the expected issuer with `id.did('key')` from the supplied disposable seed, then require exact issuer equality and a valid proof.
- **Immediate reload must not be worked around.** Reproduced: the network recorded the install, but reloading after the detail showed **Open** restored a persisted pre-install list and displayed **Get**. `useInstalledApps` now revalidates on mount even within its 2-minute `staleTime`; this journey passed with immediate reload after that fix. Keep the no-sleep assertion so persistence races cannot masquerade as successful installs.
- The side modal hides the list from the accessibility tree. Reload dismisses it before the row assertion; reopening uses **More options**.
- The example app also has a standalone mock-host mode. Never accept its mock banner. Even the real-host banner and `JWT received` text are insufficient: actual correlated messages and cryptographic verification are mandatory.

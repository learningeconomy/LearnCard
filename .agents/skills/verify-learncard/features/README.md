# LearnCard verification map

This is the maintained source for verifying what LearnCard users and developers actually touch. Each file is a recipe written from the user's point of view. `apps/learn-card-app/scripts/verification/catalog.ts` is the executable contract: a feature passes only when its journey asserted every listed entry ID. `all` means this catalog, **not** every LearnCard route.

`$LCV` below means `bun run --cwd apps/learn-card-app lc verify` (from the repo root).

## Baseline preconditions

```bash
$LCV up --dir /tmp/lcv && $LCV doctor --dir /tmp/lcv     # "ok": true, "authenticated": true
```

- **Origins.** App `http://localhost:3000`, brain `:4000`, LearnCloud `:4100`, LCA API `:5100`, all owned by this stack and built from the checkout. `127.0.0.1` is a different browser origin, so don't mix the two.
- **Actors.** Every run mints fresh actors: random 64-hex seeds and unique `v-<run>-<role>-xxxx` handles. Nothing depends on fixed seeds, `tests/states/*.json`, or the e2e `/delete-all` reset.
- **Sign-in.** Developer seed sign-in (`/developer/sign-in?profileId=<handle>`) creates the network profile. Email OTP, social, phone, and passkey providers are **not** provisioned. The public email field is driven, never submitted.
- **Network policy.** Owned origins, plus GET/HEAD to static hosts (fonts, JSON-LD contexts, `peerbadges.com` badge packs). DIDKit WASM is served from the checkout in place of its CDN copy (same bytes). Everything else is blocked and listed in `*-network.json`. LaunchDarkly and analytics are disabled.
- **AI and uploads.** AI services, file-upload storage, and the xAPI LRS are not provisioned. Features needing them are unreachable here (see below).

## Driving conventions

- Prefer roles and accessible names (`getByRole('button', { name: 'Accept' })`), then placeholders and labels. Use CSS only where the product exposes nothing else (`.issued-by`, `#right-modal`, `ion-item`). Never use coordinates or tab order.
- Ionic side modals hide the page behind them from the accessibility tree. Close the modal (Back/Close) before asserting on the list underneath.
- A fresh browser context loads ~2.7k unbundled dev modules (≈25s). First renders get a 120s budget; later assertions use 30–60s. Wait on a visible state, never a fixed sleep. App installation reloads immediately after the success UI, without waiting for a cache persister.
- **Blank page after a reload, on a fresh stack?** Check `frontend.log` for `new dependencies optimized: … reloading` and `The file does not exist at …/vite-cache/deps/chunk-…`. Vite discovered a dependency at runtime and swapped chunks under the loading page. The fix belongs in `apps/learn-card-app/vite.config.mts` `optimizeDeps.include`: add the importer path (`'@learncard/<pkg> > <dep>'`), never a longer timeout. It affects every developer on a cold cache, not just the verifier.
- Before claiming a credential is stored, prove it from a second view: reload, another actor, the SDK, or `db`.
- Verify the same artifact the UI created or claimed: exact title, issuer, subject, persisted index record, and cryptographic proof. A different SDK fixture does not validate a browser-issued credential. Partner Connect identity proof must inspect and verify the actual response, not an unconditional success banner.

## Proof and skip reporting

- Report the feature ID, entry IDs, and the `runs/<id>/report.json` path. Attach before/after screenshots for UI claims, CLI JSON for CLI claims, and the graph or record JSON for side effects.
- A failing entry is reported as failing, with its `*-failure*.png`, the error's first line, and whether it's map drift (copy or selector changed), a harness gap, or a product bug. Never report a nearby entry as covering it.
- Unreachable means the concrete prerequisite plus the route attempted.
- An interruption is not a pass. `run` and `script` retain `status: interrupted`, screenshots/traces, and a nonzero exit code; check that their evidence survives teardown.

## Feature entry contract

Every feature file has an H1 and a one-paragraph summary, then exactly these H2s in order: `Sub-features` (entry IDs, one line each), `How to get to it (user POV)`, `Driving it with lc verify` (`Preconditions:`, then labeled steps pairing the user action, the exact command or locator, and the observable result), and `Gotchas`.

## Features

| Feature        | Surface               | Recipe                                       | Entries                                                                                                                 |
| -------------- | --------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `account`      | web                   | [Sign-in & account](account.md)              | `auth-public-email-entry`, `auth-developer-seed`, `auth-onboarding`, `auth-sign-out`                                    |
| `language`     | web                   | [Language switching](language.md)            | `locale-login-switch`, `locale-login-persistence`, `locale-sidebar-switch`                                              |
| `credentials`  | web                   | [Boosting & claiming badges](credentials.md) | `wallet-self-issue`, `wallet-detail-persistence`, `wallet-peer-claim`                                                   |
| `sharing`      | web                   | [Credential share links](sharing.md)         | `share-menu-copy`, `share-anonymous-view`                                                                               |
| `contacts`     | web                   | [Contacts & connections](contacts.md)        | `contacts-search`, `contacts-request`, `contacts-accept`, `contacts-mutual`                                             |
| `app-store`    | web + Partner Connect | [App store](app-store.md)                    | `apps-public-sign-in-intent`, `apps-browse-detail`, `apps-install-persist-launch`                                       |
| `sdk`          | SDK                   | [LearnCard SDK](sdk.md)                      | `sdk-identity`, `sdk-issue-verify`, `sdk-presentation`, `sdk-cloud-roundtrip`, `sdk-boost-send-accept`                  |
| `cli`          | CLI                   | [`learncard` CLI](cli.md)                    | `cli-send`, `cli-recipient-claims`, `cli-status`, `cli-verify`                                                          |
| `sdk-to-app`   | cross-surface         | [SDK issuer → app learner](sdk-to-app.md)    | `cross-sdk-send`, `cross-app-claim`, `cross-app-wallet-detail`, `cross-sdk-observes-claim`                              |
| `consent-flow` | cross-surface         | [ConsentFlow](consent-flow.md)               | `consent-partner-contract`, `consent-app-door`, `consent-app-accept`, `consent-partner-reads`, `consent-partner-issues` |
| `docs`         | docs                  | [Docs quickstart](docs.md)                   | `docs-snippets-in-sync`, `docs-quickstart-send`, `docs-quickstart-received`                                             |

## Not covered yet (and what each needs)

Drive these with `$LCV script` when your change touches them, and record what you proved. None of them count as covered by a nearby feature.

- **Email/phone OTP, Google/Apple sign-in, passkeys, account recovery.** Needs a provisioned Firebase or Keycloak tenant and a mail/SMS sink. The local tenant uses Keycloak config without a running Keycloak.
- **AI features** (My Assistant, AI Pathways, insights, AI sessions). Needs `services/learn-card-network/ai-agent` and model credentials. `features.aiFeatures` is off.
- **Developer portal** (`/app-store/developer/*`: integrations, guides, listing submission) and **app-store admin**. Reachable with a signed-in actor through `script`; no recipe yet.
- **Boost CMS / `/issue` authoring, claim links (`/claim/boost`), OID4VCI/OID4VP, CHAPI.** Reachable through `script`. OID4VC interop has its own suites in `tests/openid4vc-*`.
- **Families/guardian flows, Pathways, skills frameworks, resume builder.** Reachable through `script`. Skill frameworks need `bun run skill-frameworks seed` against the stack.
- **ScoutPass (`apps/scouts`).** A separate app that this stack does not serve.
- **Native (Capacitor iOS/Android), push notifications, Capgo OTA.** Need devices or emulators; browser runs prove nothing native.
- **Escrow enclave services, xAPI/LRS, file uploads.** Not in the verification compose set.

## Extending

1. Explore with `$LCV script` until the real path and stable handles are known.
2. Add `journeys/<feature>.ts` exporting a `FeatureDefinition` (`id`, `title`, `surface`, `entries`, `run`). Use `context.step` for UI actions, `context.sdk` and `context.inspect` for corroboration, and `context.record` for nonsecret JSON.
3. Register it in `catalog.ts` and add a recipe file and a table row here.
4. Run it on an empty owned stack (`$LCV run <id>`) and again on a retained one (`--dir`). Typecheck with `bunx tsc -p apps/learn-card-app/scripts/verification/tsconfig.json`.

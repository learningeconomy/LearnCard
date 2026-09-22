# Private credential link UI preview

This isolated harness renders the production creation and recipient components with synthetic credentials and mocked wallet/network methods. It does not publish links, access accounts, or prove server integration. AES-GCM encryption/decryption uses the real shared helpers; signature badges here use fixture responses.

From the repository root:

```sh
bun --cwd apps/learn-card-app run i18n:compile
bunx vite --config apps/learn-card-app/tests/share-links-harness/vite.config.mts
```

Open `http://127.0.0.1:3018/` for creation. The mocked creation endpoint returns success; copied links point to `preview.example` and are deliberately not live.

Choose credentials, set an expiry, and review the recipient preview before creating the fixture link. Add `?locale=ar` to check Arabic and right-to-left layout; `en`, `es`, and `fr` are also supported. On the recipient fixture, Download JSON exports its signed presentation.

Recipient fixture:

```text
http://127.0.0.1:3018/s/AAAAAAAAAAAAAAAAAAAAAA#AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

Omit the fragment for the incomplete-link state. Add `?state=expired`, `?state=stopped`, or `?state=not_found` before the fragment for inactive states. All fixture IDs/keys are public test values.

The real SDK cryptographic boundary has a separate executable smoke test:

```sh
bun --conditions=development apps/learn-card-app/tests/share-links-harness/crypto-smoke.ts
```

## Rollout configuration

Create a Boolean LaunchDarkly flag with key `share-multiple-enabled`, available to the client-side SDK, with a default/off value of `false`. The React SDK exposes it as `shareMultipleEnabled`. Target local and staging to `true` to show the creation button. The public recipient route is independent of this flag, so disabling creation does not break existing links.

Backend APIs and recovery/cleanup have no rollout flags. They run when their service connection and trust configuration is complete; see the Brain and LearnCloud `.env.example` files. Missing wiring stays inactive, and partial/invalid configuration fails closed. The deployed maintenance schedule runs automatically; authorization, replay protection, expiry, and age/counting policy remain enforced.

## Backend regression tests

From `services/learn-card-network/brain-service`:

```sh
bunx vitest run --config vitest.share-links-unit.config.ts
bunx vitest run --config vitest.share-links-neo4j.config.ts
```

The first command runs the DB-free protocol, lifecycle, policy, router, and HTTP tests.
The second requires Docker and runs the six database suites serially against the
existing disposable Neo4j harness. Filter either command by filename to run one suite,
for example append `share-link-recovery.neo4j.spec.ts` to the second command.

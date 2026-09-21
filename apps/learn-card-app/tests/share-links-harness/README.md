# Private credential link UI preview

This isolated harness renders the production creation and recipient components with synthetic credentials and mocked wallet/network methods. It does not publish links, access accounts, or prove server integration. AES-GCM encryption/decryption uses the real shared helpers; signature badges here use fixture responses.

From the repository root:

```sh
bunx vite --config apps/learn-card-app/tests/share-links-harness/vite.config.mts
```

Open `http://127.0.0.1:3018/` for creation. The mocked creation endpoint returns success; copied links point to `preview.example` and are deliberately not live.

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

Create a Boolean LaunchDarkly flag with key `share-links-enabled`, available to the client-side SDK, with a default/off value of `false`. The React SDK exposes it as `shareLinksEnabled`. Target local and staging to `true` to show the creation button. The public recipient route is independent of this flag, so disabling creation does not break existing links.

Backend APIs and recovery/cleanup have no rollout flags. They run when their service connection and trust configuration is complete; see the Brain and LearnCloud `.env.example` files. Missing wiring stays inactive, and partial/invalid configuration fails closed. The deployed maintenance schedule runs automatically; authorization, replay protection, expiry, and age/counting policy remain enforced.

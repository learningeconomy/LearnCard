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

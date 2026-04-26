# OID4VC Playground

A curated, click-to-launch UI for testing every OID4VCI / OID4VP flow that the LearnCard wallet supports — without copy-pasting URLs from external verifier dashboards.

## Why this exists

When you change anything in the OID4VC code path (the plugin, the `ClaimFromRequest` page, the `Oid4vpExchange` consent screen, the `useCredentialOfferAcceptance` hook), you need a way to quickly see *every* permutation:

- Did I break the PIN modal?
- Does the multi-candidate picker still appear?
- Does the JARM "encrypted response" badge show up?
- Did the auth-code flow regress?

The playground is the curated checklist + one-click launcher for those answers. Every scenario lives in `src/scenarios.ts` so the catalogue is the executable spec for what flows the wallet supports.

## Quick start

```bash
# 1. Boot the walt.id Docker stack used as the OID4VC engine
cd ../../tests/openid4vc-interop-e2e
docker compose up -d
# (give walt.id ~10 s to come up; verifier is on :7003, issuer on :7002)

# 2. Run the playground
cd ../../examples/openid4vc-playground
pnpm install
pnpm dev
# → open http://localhost:5173
```

In a separate terminal, run the LearnCard app:

```bash
cd ../../apps/learn-card-app
pnpm dev
```

Then in the playground, click any scenario card → the panel shows a QR code and an **Open in LearnCard** deep link. Use the link to drive the flow on the same machine, or scan the QR with a phone if `pnpm dev --host` is active.

## What's covered in v1

### Issuance (OID4VCI)
| Scenario                 | Exercises                                                       |
|--------------------------|-----------------------------------------------------------------|
| Pre-auth, no PIN         | Offer parser + token exchange + credential issuance happy path  |
| Pre-auth with PIN        | PIN modal flow + `tx_code` passthrough on token exchange        |
| Authorization code flow  | PKCE + authorize redirect + token exchange (Slice 4)            |

### Verification (OID4VP)
| Scenario                  | Exercises                                                   |
|---------------------------|-------------------------------------------------------------|
| PEX, single descriptor    | PEX matcher + consent screen happy path with one row        |
| PEX, multi-candidate      | Per-row picker + selected-index threading through `buildChosenList` |
| JARM (encrypted response) | JARM badge on consent screen + encrypted response transport |

## What's *not* yet in v1

The framework is sized for these but the scenarios aren't filled in. Each is a config block in `src/scenarios.ts` plus a server impl in `server/api.ts`:

- **VCI**: multi-credential offer, already-claimed (replay), expired offer
- **VP**: PEX multi-descriptor, PEX with `purpose` + `constraints.fields[]`, DCQL single, DCQL with claims, can't-satisfy

## Architecture

```
examples/openid4vc-playground/
├── server/                          # Node-only modules used by Vite middleware
│   ├── waltid.ts                    # Admin API client for the walt.id Docker stack
│   ├── api.ts                       # Scenario dispatcher: launch + status endpoints
│   └── middleware.ts                # Vite plugin that mounts /api/* on the dev server
└── src/
    ├── App.tsx                      # Top-level UI (tabs + provider picker + launch panel)
    ├── api.ts                       # Browser-side client for /api/launch + /api/status
    ├── scenarios.ts                 # Single source of truth — what scenarios exist
    └── components/
        ├── ScenarioCard.tsx         # One tile per scenario
        └── LaunchPanel.tsx          # QR + deep link + live status
```

Two non-obvious decisions worth knowing:

- **Vite middleware over a separate Express server.** Lets `pnpm dev` start everything with one command. The walt.id calls happen Node-side so the issuer signing key never leaves the dev machine.
- **By-reference → by-value rewriting.** walt.id Docker emits `credential_offer_uri=http://localhost:7002/...`, but the LearnCard wallet rejects HTTP on that field (a pre-auth code over plain HTTP would be a credential leak). The playground server resolves the reference and inlines the JSON before handing the URI to the browser. See `server/waltid.ts → resolveOfferToByValue`.

## Adding a scenario

Two-step:

1. **Describe it** in `src/scenarios.ts`:
    ```ts
    {
        id: 'vp-pex-multi-descriptor',
        kind: 'vp',
        name: 'PEX, multi-descriptor (two rows)',
        description: 'Verifier asks for two distinct credential types in one request.',
        exercises: 'Multi-row consent screen + multi-pick threading.',
        supportedProviders: ['waltid'],
    }
    ```

2. **Implement it** in `server/api.ts` under the `IMPLS` map keyed by `<providerId>:<scenarioId>`:
    ```ts
    'waltid:vp-pex-multi-descriptor': {
        kind: 'vp',
        label: 'PEX multi-descriptor — walt.id',
        run: async () => {
            const session = await createWaltidVerifySession({
                verifierBaseUrl: VERIFIER_BASE_URL,
                requestCredentials: [
                    { type: 'UniversityDegree', format: 'jwt_vc_json' },
                    { type: 'OpenBadgeCredential', format: 'jwt_vc_json' },
                ],
            });
            return { rawAuthRequestUri: session.authorizationRequestUri, state: session.state };
        },
    },
    ```

The UI auto-lists scenarios from the catalogue; the server auto-dispatches by id. No third edit needed.

## Adding a provider

The catalogue is multi-provider from day 1. To add Sphereon (already has a port-ready helper at `tests/openid4vc-interop-e2e/setup/sphereon-verifier.ts`):

1. Add `'sphereon'` entries under `IMPLS` in `server/api.ts`, calling Sphereon-specific helpers.
2. Flip `enabled: true` on the Sphereon entry in `PROVIDERS` (in `src/scenarios.ts`).
3. Mark the relevant scenarios as `supportedProviders: ['waltid', 'sphereon']`.

The provider dropdown surfaces the new option automatically; cards greys out for scenarios that provider doesn't yet implement.

## Phone testing

Default binding is `localhost`, which only the dev machine can reach. To scan the QR from a phone:

```bash
pnpm dev --host
```

Vite then prints a LAN address. The walt.id Docker stack also binds on the LAN by default — when the wallet hits `http://<lan-ip>:7002/...` directly, things work without further config.

For wallets on networks that can't reach your LAN (e.g. testing from a coffee shop), use [ngrok](https://ngrok.com) or [cloudflared](https://github.com/cloudflare/cloudflared) to tunnel the playground + walt.id ports. The README in `tests/openid4vc-interop-e2e/` has the recipe.

## Troubleshooting

**"Launch failed with HTTP 500"**
The walt.id Docker stack probably isn't running. `cd ../../tests/openid4vc-interop-e2e && docker compose ps` should show two running services on ports 7002 (issuer) and 7003 (verifier).

**"walt.id verifier returned URI with no state param"**
walt.id schema drift. Check `compose.yaml` is using the version pinned by the e2e tests (currently `waltid/issuer-api:latest` and `waltid/verifier-api:latest`).

**QR scans but nothing happens in the wallet**
The wallet's deep-link handler probably isn't registered. On macOS, install the LearnCard iOS app (or LCA web) and re-scan; the OS prompt will offer to open in the wallet.

**JARM scenario fails with "JWE encryption error"**
walt.id's verifier publishes the JWKS used for JARM at `/openid4vc/jwks` — the wallet fetches it during the response build. If the verifier container restarted between scenarios, the keys may have rotated; just re-launch.

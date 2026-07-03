# @learncard/console-bff-service

EducationOS console backend-for-frontend: pluggable auth providers, KMS-backed managed
`did:web` identities, JIT provisioning, Redis sessions, and signed httpOnly cookies
(ADR-001 §3.9–§3.10).

## Run it locally (Tier 1 — standalone dev)

Boots console-bff on its own. brain-service calls go to an in-process **stub** (no
brain-service required), so you can exercise the whole login/provisioning flow.

### 1. Start Redis + Mongo

```bash
bun run dev:services          # docker compose: redis:6379, mongo:27017
```

If ports 6379/27017 are already taken by another LearnCard dev stack, skip this and point
at the running instances with `REDIS_HOST` / `REDIS_PORT` / `MONGO_URI`.

### 2. Start the service

```bash
bun run dev                   # http://localhost:3200 ; sets CONSOLE_BFF_DEV_INSECURE_AUTH=true
```

### 3. Drive the auth-coordinator login flow

```bash
B=http://localhost:3200

# begin login -> returns a redirectUrl carrying a CSRF `state`
LOGIN=$(curl -s -X POST $B/auth/login -H 'x-tenant-id: learncard' -H 'content-type: application/json' \
  -d '{"providerId":"lef-wallet","redirectUri":"http://localhost:3200/cb"}')
STATE=$(node -e "process.stdout.write(new URL('$(echo $LOGIN | node -e 'process.stdin.once("data",d=>process.stdout.write(JSON.parse(d).redirectUrl))')').searchParams.get('state'))")

# craft a DEV presentation (decode-only verifier reads vp.holder; NOT signature-checked)
VP=eyJhbGciOiJFUzI1NiJ9.$(node -e "process.stdout.write(Buffer.from(JSON.stringify({iss:'did:key:z6MkDemo',vp:{holder:'did:key:z6MkDemo'}})).toString('base64url'))").sig

# callback -> mints a managed did:web, JIT-provisions, sets the session cookie
curl -s -c cookies.txt -X POST $B/auth/callback -H 'x-tenant-id: learncard' -H 'content-type: application/json' \
  -d "{\"providerId\":\"lef-wallet\",\"params\":{\"vp\":\"$VP\",\"state\":\"$STATE\"}}"

# read the session
curl -s -b cookies.txt $B/auth/session

# resolve the minted managed DID document (use the profileId = last segment of managedDid)
curl -s $B/p/<profileId>/did.json

# logout
curl -s -b cookies.txt -X POST $B/auth/logout
```

## Configuration (env)

| Var                             | Default                                     | Notes                                                                                |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `PORT` / `HOST`                 | `3200` / `0.0.0.0`                          |                                                                                      |
| `CONSOLE_DOMAIN`                | `localhost:3200`                            | Authority baked into managed `did:web`. Must match the host serving `/p/*/did.json`. |
| `COOKIE_SECRET`                 | dev value                                   | HMAC key for the session cookie. Set in any real deploy.                             |
| `SECURE_COOKIES`                | `NODE_ENV===production`                     |                                                                                      |
| `REDIS_HOST` / `REDIS_PORT`     | `127.0.0.1` / `6379`                        | Sessions + login state.                                                              |
| `MONGO_URI` / `MONGO_DB`        | `mongodb://127.0.0.1:27017` / `console-bff` | Identity bindings + managed-key directory.                                           |
| `TENANT_POLICY_FILE`            | `dev/policies.json`                         | `TenantAuthPolicy[]` loaded at boot.                                                 |
| `BRAIN_SERVICE_URL`             | _(unset → stub)_                            | Set to a running brain-service `/api` origin for real provisioning.                  |
| `KMS_PROVIDER`                  | `local`                                     | `aws` for AWS KMS.                                                                   |
| `CONSOLE_BFF_DEV_INSECURE_AUTH` | `false`                                     | Enables the decode-only DID-Auth verifier. **Dev only.**                             |

## Dev caveats

-   **Local KMS is in-memory.** Managed keys do not survive a restart, so a returning
    subject's DID doc won't resolve after a reboot (its key is gone). Use a fresh subject per
    boot, drop the `console-bff` Mongo db between runs, or use `KMS_PROVIDER=aws`.
-   The dev DID-Auth verifier does **not** verify signatures — it only reads `vp.holder`. A
    real deployment must supply a verifier that resolves the presenter's DID and checks the JWS.

## Tier 2 (not yet wired)

Real two-process integration with brain-service (set `BRAIN_SERVICE_URL`, add the console
service DID to brain-service `AUTHORIZED_SERVICE_DIDS`, seed the tenant root ecosystem)
additionally requires brain-service to resolve the managed `did:web` **over HTTPS** — local
TLS (mkcert) + a hosts entry, or a brain-service dev flag for HTTP localhost resolution.

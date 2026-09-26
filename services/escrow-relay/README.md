# Escrow Relay

Minimal recovery-key email relay. The client encrypts the complete email payload with a pinned
P-256 public key; `lca-api` proxies only the ciphertext and expected recipient. This service
decrypts transiently, verifies the encrypted recipient binding, renders the tenant-branded
recovery email, and waits for Postmark acceptance.

The public key is intentionally delivered through signed/baked tenant configuration, not a
runtime `/public-key` endpoint. A compromised `lca-api` must not be able to substitute its own
key and recover future shares.

## Generate a relay keypair

```bash
openssl ecparam -name prime256v1 -genkey -noout -out relay-private.pem
openssl pkcs8 -topk8 -nocrypt -in relay-private.pem -outform DER | base64 | tr -d '\n'
openssl pkey -in relay-private.pem -pubout -outform DER | base64 | tr -d '\n'
```

Store the first output only in the relay account as:

```text
ESCROW_RELAY_PRIVATE_KEYS_JSON={"2026-09":"<PKCS8_BASE64>"}
```

Publish the second output and matching key ID to clients as
`VITE_ESCROW_RELAY_PUBLIC_KEY` and `VITE_ESCROW_RELAY_KEY_ID` (or the equivalent tenant
`auth.sss` fields). Delete the PEM after transferring it into the relay secret store.

## Environment

- `ESCROW_RELAY_PRIVATE_KEYS_JSON` — key ID to PKCS#8 private-key map (supports overlap during rotation)
- `ESCROW_RELAY_AUTH_TOKEN` — high-entropy bearer token shared only with the `lca-api` proxy
- `POSTMARK_SERVER_TOKEN` — relay-only Postmark server token
- `POSTMARK_FROM_DOMAIN` — safe fallback sender domain
- `ALLOWED_FROM_DOMAINS` — comma-separated Postmark-verified tenant sender domains
- `POSTMARK_MESSAGE_STREAM` — optional Postmark stream (default `outbound`)

The service has no MongoDB/Redis dependency, no `SEED`, and no imports from `lca-api`.

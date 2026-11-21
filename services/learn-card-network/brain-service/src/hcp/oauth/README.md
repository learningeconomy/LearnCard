# HCP OAuth (Unit 1): AS + PRM + RS probe

Draft 3 §13 OAuth Interop Profile for LearnCard HCP. Spec pin
`b790561830702c067cd7810c96ee78dd3d84741c`.

## What this is

An access token **represents** an `HcpV1Grant` (`grant_id` + client DID in the JWT).
The live Neo4j/memory grant remains the authorization truth on every request (§13.6).
Tool arguments must **not** carry `grantId` (Taylor Q2).

This unit ships:

- Protected Resource Metadata at `/.well-known/oauth-protected-resource` (RFC 9728 / §13.5)
- Authorization Server Metadata at `/.well-known/oauth-authorization-server`
- Dynamic client registration, Authorization Code + PKCE
- DID-authenticated consent in the LearnCard app (below)
- RS probe `GET /hcp/oauth/v1/probe` (bearer to grant metadata; not an MCP tool)

MCP tools + Unit 3 conformance live under `../mcp/`. Official `conformsTo` Part URIs remain unclaimed (see `../mcp/CONFORMANCE.md`).

## Consent (DID-authenticated)

1. `GET /oauth/authorize` validates the client, redirect URI, PKCE and scopes (each must
   be in the PRM `scopes_supported`; an empty `scope` means all of them), keeps the
   pending request, and redirects to `<consentAppUrl>/hcp/connect?oauth_request=<ticket>`.
2. The ticket is an HS256 JWT under the token secret: `typ` `hcp-oauth-request`, `iss`
   = this AS, `aud` `urn:learncard:hcp:oauth-consent`, 10 minutes, with `request_id`,
   `client_id`, `client_name` (registered name, else `client_id`), `client_did` and
   `scope`. The app decodes it only for display.
3. The signed-in person taps Allow. The app calls `hcp.v1.oauth.approve({ ticket })` on
   the brain (DID auth + challenge). The brain verifies the ticket, issues a grant from
   the caller to `client_did` for exactly those scopes (temporary 1h, purpose
   `https://learncard.com/hcp/purposes/app-access`, writes land as suggestions), or
   reuses an active grant to the same client with the same scopes, and returns
   `<issuer>/oauth/consent/complete?assertion=<jwt>`.
4. The assertion is an HS256 JWT: `typ` `hcp-consent`, `aud` = this AS's issuer,
   `sub` = the authenticated subject DID, `request_id`, `grant_id`, `jti`, 120 seconds.
5. `GET /oauth/consent/complete` verifies it and binds the grant only if its subject is
   the assertion's `sub`, it was issued to this OAuth client's DID, it is active, and
   it covers the requested scopes. The pending request is taken on first use, so a
   replayed assertion fails.

OAuth client DID (`deriveOAuthClientDid`): `did:web:<issuer host, port as %3A>:hcp:oauth-clients:<client_id>`.
Keyless: the client never signs, the AS mints its tokens, and no DID document is
served. AS client ids (`hcp_oauth_<hex>`) are DID-safe; any other id would be replaced
by base64url(sha256(client_id)).

The brain must share the AS's secret and know its URL: `HCP_OAUTH_TOKEN_SECRET` and
`HCP_OAUTH_ISSUER_URL`. The dev servers read `HCP_OAUTH_ISSUER_URL` too (absolute
http(s); default `http://127.0.0.1:<port>`; one trailing slash dropped); set the same
value on both.

The old typed form (subject DID + grant id, no authentication) is served at
`/oauth/consent` only with `devTypedConsent: true` (dev servers:
`HCP_OAUTH_DEV_TYPED_CONSENT=1`), and construction throws if NODE_ENV is production.

## How do I test this

### Automated

From `services/learn-card-network/brain-service`:

```bash
bunx vitest run --config vitest.config.ts src/hcp/oauth
# consent.test.ts: the app handoff, approve, complete, replay, revoke
bunx vitest run --config vitest.integration.config.ts test/hcp-v1.spec.ts
# hcp.v1.oauth.approve behind DID auth (testcontainers Neo4j)
```

### Manual (free high port; does not restart Roadie)

```bash
cd services/learn-card-network/brain-service
bun --conditions=development src/hcp/oauth/dev-server.ts 18765
# prints baseUrl, subjectDid, grantId, and a curlPrm one-liner

curl -s http://127.0.0.1:18765/.well-known/oauth-protected-resource | jq .
curl -s http://127.0.0.1:18765/.well-known/oauth-authorization-server | jq .

# Full Authorization Code + PKCE to probe is covered by oauth.test.ts / consent.test.ts.
# Consent goes to the app at HCP_OAUTH_CONSENT_APP_URL. For the dev typed form
# (paste subjectDid + grantId), start with HCP_OAUTH_DEV_TYPED_CONSENT=1.
```

For Claude Code against real MCP tools, see `../mcp/README.md` (Unit 2). Unit 1 proves PRM, AS, token, and probe.

## Decisions (Unit 1)

| Topic                      | Choice                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Placement                  | `brain-service/src/hcp/oauth/` (HCP-specific AS). Not lifted into `@learncard/mcp` yet. Passport tokens are not grant-bound. |
| Token mint                 | Consent in the app issues (or reuses) a grant to the OAuth client's derived DID; the token represents that grant.            |
| OAuth client vs HCP client | `client_id` = MCP host; JWT `sub` = `grant.client.id`.                                                                       |
| Consent                    | LearnCard app `/hcp/connect` + `hcp.v1.oauth.approve` (DID auth). Typed form only with `devTypedConsent`, never production.  |
| Token alg                  | HS256 with `HCP_OAUTH_TOKEN_SECRET` for local Unit 1.                                                                        |
| Q3 reportSharing           | Deferred to Unit 2 tools (expose real or not-implemented error; do not omit).                                                |
| Q4 createEntry WritePolicy | Spec path default; LC `canWrite` stays a marked extension when tools land.                                                   |
| Q7 conformsTo              | Unit 3 suite landed; official Part URIs still unclaimed (§18.1 / CONFORMANCE.md).                                            |

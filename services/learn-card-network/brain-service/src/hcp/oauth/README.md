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
- Dynamic client registration, Authorization Code + PKCE, local consent HTML
- RS probe `GET /hcp/oauth/v1/probe` (bearer to grant metadata; not an MCP tool)

MCP tools + Unit 3 conformance live under `../mcp/`. Official `conformsTo` Part URIs remain unclaimed (see `../mcp/CONFORMANCE.md`).

## How do I test this

### Automated

From `services/learn-card-network/brain-service`:

```bash
bunx vitest run --config vitest.config.ts src/hcp/oauth/oauth.test.ts
```

### Manual (free high port; does not restart Roadie)

```bash
cd services/learn-card-network/brain-service
bun --conditions=development src/hcp/oauth/dev-server.ts 18765
# prints baseUrl, subjectDid, grantId, and a curlPrm one-liner

curl -s http://127.0.0.1:18765/.well-known/oauth-protected-resource | jq .
curl -s http://127.0.0.1:18765/.well-known/oauth-authorization-server | jq .

# Full Authorization Code + PKCE to probe is covered by oauth.test.ts.
# Browser consent: open the authorize URL your client gets, paste subjectDid + grantId.
```

For Claude Code against real MCP tools, see `../mcp/README.md` (Unit 2). Unit 1 proves PRM, AS, token, and probe.

## Decisions (Unit 1)

| Topic                      | Choice                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Placement                  | `brain-service/src/hcp/oauth/` (HCP-specific AS). Not lifted into `@learncard/mcp` yet. Passport tokens are not grant-bound. |
| Token mint                 | AS authorize + consent selects an **already-issued** grant (smallest path for Claude Code OAuth).                            |
| OAuth client vs HCP client | `client_id` = MCP host; JWT `sub` = `grant.client.id`.                                                                       |
| Local consent              | Open HTML form (subject DID + grant id). Production must DID-auth (§6.1.6).                                                  |
| Token alg                  | HS256 with `HCP_OAUTH_TOKEN_SECRET` for local Unit 1.                                                                        |
| Q3 reportSharing           | Deferred to Unit 2 tools (expose real or not-implemented error; do not omit).                                                |
| Q4 createEntry WritePolicy | Spec path default; LC `canWrite` stays a marked extension when tools land.                                                   |
| Q7 conformsTo              | Unit 3 suite landed; official Part URIs still unclaimed (§18.1 / CONFORMANCE.md).                                            |

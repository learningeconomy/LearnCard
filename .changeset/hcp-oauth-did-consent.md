---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/network-plugin': minor
'learn-card-base': minor
'learn-card-app': minor
---

HCP OAuth consent is now DID-authenticated. `/oauth/authorize` hands off to the LearnCard app's `/hcp/connect?oauth_request=<ticket>` (an HS256 ticket naming the client, its derived DID and the scopes). Allow calls the new `hcp.v1.oauth.approve({ ticket })` (DID auth), which issues a fresh 1-hour grant from the signed-in subject to the OAuth client's keyless DID `did:web:<AS host>:hcp:oauth-clients:<client_id>` (superseding an earlier one to the same client with the same scopes, so a re-login gets a full hour) and returns the AS's `/oauth/consent/complete?assertion=` URL. Don't allow calls the new `hcp.v1.oauth.deny({ ticket })`. The AS binds the code only from that signed assertion. Once the client and its registered redirect_uri are validated, consent errors (including Don't allow) redirect there with `error` and `state` (RFC 6749 §4.1.2.1) instead of a JSON 400, so `claude mcp login` fails fast. The typed subject/grant form is dev-only (`devTypedConsent`, refused in production). Adds `useHcpOAuthApprove`, `useHcpOAuthDeny` and an OAuth mode for the consent screen, and `HCP_MCP_DEV_STORE=neo4j` and `HCP_OAUTH_ISSUER_URL` for the local MCP dev server.

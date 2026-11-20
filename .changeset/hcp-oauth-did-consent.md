---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/network-plugin': minor
'learn-card-base': minor
'learn-card-app': minor
---

HCP OAuth consent is now DID-authenticated. `/oauth/authorize` hands off to the LearnCard app's `/hcp/connect?oauth_request=<ticket>` (an HS256 ticket naming the client, its derived DID and the scopes). Allow calls the new `hcp.v1.oauth.approve({ ticket })` (DID auth), which issues or reuses a grant from the signed-in subject to the OAuth client's keyless DID `did:web:<AS host>:hcp:oauth-clients:<client_id>` and returns the AS's `/oauth/consent/complete?assertion=` URL. The AS binds the code only from that signed assertion. The typed subject/grant form is dev-only (`devTypedConsent`, refused in production). Adds `useHcpOAuthApprove` and an OAuth mode for the consent screen, and `HCP_MCP_DEV_STORE=neo4j` for the local MCP dev server.

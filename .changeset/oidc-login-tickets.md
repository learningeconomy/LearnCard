---
"@learncard/lca-api-service": minor
---

Add the lca-api OIDC identity provider with RS256 signing, permanent UUID subjects,
single-use login tickets, authorization codes and opaque access tokens. The
`auth.requestLoginTicket` and `auth.requestSocialLoginTicket` routes verify email
codes or native Google/Apple proofs. Keycloak brokers the redirect flow without
an additional login form. Includes Docker/Lambda wiring, a development broker
fixture and protocol tests. Phone OTP and full live broker round-trip CI remain deferred.

# Auth Grants and API Tokens

An **API token** lets a server call the LearnCard Network over plain HTTPS without holding your seed. Behind every token is an **auth grant**: a named record on your profile that says what the token may do and until when.

```
your profile ──owns──▶ auth grant { name, scope, expiresAt } ──mints──▶ API token (JWT)
```

You create the grant once (Developer Portal → **API Tokens**, or `addAuthGrant()`), mint a token from it (`getAPITokenForAuthGrant()`), and send `Authorization: Bearer <token>` with each request. The network checks the token's grant is still active and its scope covers the route. Walkthrough: [Generate API Tokens](../../how-to-guides/deploy-infrastructure/generate-api-tokens.md).

## Scopes

A scope is `resource:action`. Space-separate several; `*` wildcards either half.

| Resource             | Covers                                                        |
| -------------------- | ------------------------------------------------------------- |
| `boosts`             | Creating templates and sending credentials (`POST /api/send`) |
| `inbox`              | Universal Inbox issuance and status                           |
| `credentials`        | Credential records on the network                             |
| `presentations`      | Sending and receiving presentations                           |
| `profiles`           | Your profile and looking up others                            |
| `profileManagers`    | Managed profiles you administer                               |
| `connections`        | Connection requests between profiles                          |
| `contracts`          | Consent contracts you own                                     |
| `contracts-data`     | Reading data users have consented to share                    |
| `signingAuthorities` | Registering signers                                           |
| `authGrants`         | Managing other grants                                         |
| `didMetadata`        | Extra entries in your DID Document                            |
| `claimHooks`         | Actions that run when a credential is claimed                 |
| `skills`             | Skill frameworks and alignments                               |
| `app-store`          | App listings and app-scoped features                          |
| `integrations`       | Developer Portal integrations                                 |
| `contact-methods`    | Verified emails and phone numbers                             |
| `activity`           | Activity feed                                                 |
| `storage`            | Network storage                                               |

Actions are `read`, `write`, and `delete`.

Common choices:

- `boosts:write` — the minimum for sending credentials. Start here.
- `boosts:write inbox:read` — send, and check whether a send was claimed.
- `contracts:* contracts-data:read` — run a consent flow and read what users shared.
- `*:read` — a read-only token for dashboards.
- `*:*` — everything. Avoid outside local development.

## What you can't change

A grant's scope is fixed when you create it. To change what a token may do, revoke the grant and create a new one — that way an old token can never quietly gain power. Revoking a grant invalidates every token minted from it immediately.

## Habits that keep this safe

- One grant per system, named after it, so you can rotate one without touching the others.
- Set `expiresAt`. A token for a batch job shouldn't live for a year.
- Treat the token like the seed it stands in for: environment variable or secrets manager, never in code or a client bundle.
- Least scope. If the only thing a service does is send, give it `boosts:write` and nothing else.

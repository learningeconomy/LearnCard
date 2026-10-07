---
description: Create a scoped token so your server can call the LearnCard API without holding a seed.
---

# Generate API Tokens

{% hint style="info" %}
**~5 min** · After the [Quickstart](../../quick-start/your-first-integration.md).
{% endhint %}

## The one-line version

```bash
npx @learncard/cli token --scope boosts:write
```

Creates the auth grant, shows the token once, saves it to `.env` (`chmod 600`), and writes `send.sh` — a ready-to-run `curl` that reads the token from `.env`. Add `--expires 30` for a 30-day token. `--list` shows your grants; `--revoke <grantId>` revokes one.

An API token is a bearer credential tied to an **auth grant** (a named set of scopes on your profile). Use it for `POST /api/send` and other REST calls from any language; the SDK with a seed doesn't need one. See [Auth Grants and API Tokens](../../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md).

{% tabs %}
{% tab title="Developer Portal (no code)" %}

1. Sign in at [https://learncard.app/app-store/developer](https://learncard.app/app-store/developer).
2. Open your integration and go to the **API Tokens** tab.
3. Click **Create**, provide a name, scope (e.g., `boosts:write`), and optional expiry.
4. Copy the token (it is shown only once).

{% endtab %}

{% tab title="Script" %}

```typescript
// 1. Create an AuthGrant with specific permissions
const grantId = await learnCard.invoke.addAuthGrant({
    name: 'Credential Sender Auth',
    scope: 'boosts:write',
});

// 2. Generate an API token from the AuthGrant
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);
```

Then use it in the `Authorization: Bearer <token>` header of your HTTP requests. See [Sign locally, send over HTTP](../send-credentials.md#sign-locally-send-over-http) for a runnable example.
{% endtab %}
{% endtabs %}

## Scopes

Scopes define the permissions granted to a client via an API token. Each scope follows the pattern `{resource}:{action}`. You can combine multiple scopes with a space (e.g., `boosts:write inbox:read`).

| Scope          | What it allows                                                       |
| :------------- | :------------------------------------------------------------------- |
| `*:*`          | Full access to all resources                                         |
| `*:read`       | Read-only access to all resources                                    |
| `boosts:write` | Create and send credential templates (required for `POST /api/send`) |
| `inbox:write`  | Send credentials to a user's inbox                                   |
| `contracts:*`  | Manage ConsentFlow contracts                                         |
| `profiles:*`   | Manage the user's profile                                            |

## Rotate or revoke

- **Revoke:** Tokens are revoked by revoking or deleting the auth grant (via the Developer Portal API Tokens tab, or `learnCard.invoke.revokeAuthGrant(id)` / `deleteAuthGrant(id)`).
- **Expire:** Set an expiry when creating the grant to automatically invalidate the token.
- **Isolate:** Use one grant per system so you can rotate them independently.

## What you should see

A JWT — three base64 segments separated by dots. Put it in `Authorization: Bearer <token>`. Test it in one line:

```bash
curl -s https://network.learncard.com/api/profile -H "Authorization: Bearer $TOKEN"
```

Your profile comes back as JSON; a `401` means the token is wrong or expired.

## Troubleshooting

| If…                | Then                                                                                                  |
| :----------------- | :---------------------------------------------------------------------------------------------------- |
| `401 Unauthorized` | Ensure your API token is included in the `Authorization: Bearer <token>` header and hasn't expired.   |
| `403 Forbidden`    | Check that your token has the correct scope (e.g., `boosts:write` for sending credentials).           |
| `Invalid grant ID` | Verify that the `grantId` you passed to `getAPITokenForAuthGrant` exists and belongs to your profile. |

## Next steps

- [Send Signed Credentials over HTTP](../send-credentials.md#sign-locally-send-over-http)
- [Go to Production](../go-to-production.md)

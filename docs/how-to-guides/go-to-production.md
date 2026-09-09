# Go to Production

A checklist for the day you switch from test recipients to real ones. Each line links to the page that covers it.

**~10 minutes · Needs:** a working integration on staging.

## Switch from staging to production

Staging and production are separate networks — nothing carries over automatically (see [What Carries Over](deploy-infrastructure/test-safely.md#what-carries-over)). Do these in order:

- [ ] **1. Point the SDK/CLI at production** — pass `network: true` (or drop `--network` on the CLI's `send` command, which defaults to production). If you also set a `cloud: { url: '...staging...' }` override for staging testing, remove it too — `cloud.url` doesn't follow `network`, so it stays pointed at staging until you change it.
- [ ] **2. Create your production profile** — the same seed produces the same `did:key` on every network, so `createProfile`/`createServiceProfile` with that seed and (if it's free) the same `profileId` keeps your identity consistent — [Network Profiles](../core-concepts/identities-and-keys/network-profiles.md).
- [ ] **3. Create production API tokens** with the same scopes you used on staging — [Generate API Tokens](deploy-infrastructure/generate-api-tokens.md).
- [ ] **4. Register your production signing authority**, if you send from templates or issue claim links — [Set Up a Signing Authority](create-signing-authority.md).
- [ ] **5. Recreate your credential templates** with `createBoost()` and record the new `lc:network:network.learncard.com/trpc:boost:…` URIs in your config — the staging URIs won't resolve — [Issue at Scale with Credential Templates](../tutorials/create-a-boost.md).
- [ ] **6. Recreate consent contracts**, if you use ConsentFlow — [Create a ConsentFlow](../tutorials/create-a-consentflow.md).
- [ ] **7. Set your production webhook URL(s)** — the profile-level `notificationsWebhook` and/or any per-`send()` `options.webhookUrl` — [Listen to Webhooks](../tutorials/listen-to-webhooks.md).
- [ ] **8. Send one credential to your own address and claim it**, end to end, before sending to anyone else.

### Staging → Production mapping

| What                  | Staging                                      | Production                                      |
| --------------------- | -------------------------------------------- | ----------------------------------------------- |
| Network API           | `https://staging.network.learncard.com/trpc` | `https://network.learncard.com/trpc`            |
| Profile               | Profile created on staging                   | New profile — same seed, same `did:key`         |
| API tokens            | Staging `AuthGrant` + token                  | New `AuthGrant` + token, same scopes            |
| Signing authority     | Registered on staging                        | Must be re-registered on production             |
| Credential templates  | `lc:network:staging.network.learncard.com/…` | New URIs — `lc:network:network.learncard.com/…` |
| ConsentFlow contracts | Contract created on staging                  | New contract created on production              |
| Webhook URL(s)        | Points at your staging/test listener         | Must point at your production listener          |
| Issued credentials    | Only exist and are claimable on staging      | Independent — nothing from staging carries over |

## When a send fails ambiguously

A network error or timeout from `send()` doesn't tell you whether the credential was actually issued before the connection dropped. Before retrying:

1. **Check the response first.** If you got a response back with `inbox.issuanceId` (or a `credentialUri` for a direct send), it succeeded — don't retry.
2. **If the call threw or timed out, look for an existing issuance before retrying:**
    - Profile/DID recipients — [`getPaginatedBoostRecipients(templateUri)`](send-credentials.md#tracking-credential-template-recipients) and check whether your recipient is already in the list.
    - Email/phone recipients — `learnCard.invoke.getMySentInboxCredentials({ query: { boostUri: templateUri, currentStatus: 'PENDING' } })` and check whether an issuance already addresses that contact method.
3. **Only retry if neither check finds an existing record.**

Store `inbox.issuanceId` (and `activityId`) keyed by your own record ID at send time, and key your webhook processing on `issuanceId` — it stays stable even if you end up sending twice.

`TOO_MANY_REQUESTS` (429) is always safe to retry with backoff — the request was rejected before anything was issued. A 5xx or timeout is not automatically safe: the request may have already been fully processed on the server before the response was lost. See [Errors & Limits](../sdks/learncard-network/errors-and-limits.md).

## Security

- [ ] **Seed in a secrets manager**, never in code or git; rotating it means a new issuer DID — [How Should I Manage Keys?](deploy-infrastructure/choose-key-management.md)
- [ ] **API tokens scoped to what you use** (`boosts:write` for sending), with an expiry and a rotation owner — [Generate API Tokens](deploy-infrastructure/generate-api-tokens.md)
- [ ] **Signing authority registered** if you send from templates or claim links — [Set Up a Signing Authority](create-signing-authority.md)

## Reliability

- [ ] **Full flow run on staging** with your own email as recipient — [Test Safely](deploy-infrastructure/test-safely.md)
- [ ] **`PENDING` vs `ISSUED` handled**, and a webhook records claims — [Listen to Webhooks](../tutorials/listen-to-webhooks.md)
- [ ] **You know how to undo a mistake** — [Revoke or Update a Credential](revoke-or-update-a-credential.md)
- [ ] **Retries on `TOO_MANY_REQUESTS` are safe; ambiguous failures are handled deliberately** — [Errors & Limits](../sdks/learncard-network/errors-and-limits.md) · [When a Send Fails Ambiguously](#when-a-send-fails-ambiguously)

## Trust

- [ ] **Issuer profile has a real name and logo** — it's what recipients see in the claim email and wallet
- [ ] **Listed as a trusted issuer** so recipients don't see an unverified-issuer notice — [Get Listed as a Trusted Issuer](verify-my-issuer.md)

## Support

- [ ] **Someone on your team watches** [GitHub issues](https://github.com/learningeconomy/LearnCard/issues) or has [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) — and knows to tell us which issuer you are

When every box is checked, follow [Switch from Staging to Production](#switch-from-staging-to-production) above, then send to real recipients.

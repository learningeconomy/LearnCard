# Go to Production

A checklist for the day you switch from test recipients to real ones. Each line links to the page that covers it.

**~10 minutes · Needs:** a working integration on staging.

## Security

- [ ] **Seed in a secrets manager**, never in code or git; rotating it means a new issuer DID — [How Should I Manage Keys?](deploy-infrastructure/choose-key-management.md)
- [ ] **API tokens scoped to what you use** (`boosts:write` for sending), with an expiry and a rotation owner — [Generate API Tokens](deploy-infrastructure/generate-api-tokens.md)
- [ ] **Signing authority registered** if you send from templates or claim links — [Set Up a Signing Authority](create-signing-authority.md)

## Reliability

- [ ] **Full flow run on staging** with your own email as recipient — [Test Safely](deploy-infrastructure/test-safely.md)
- [ ] **`PENDING` vs `ISSUED` handled**, and a webhook records claims — [Listen to Webhooks](../tutorials/listen-to-webhooks.md)
- [ ] **You know how to undo a mistake** — [Revoke or Update a Credential](revoke-or-update-a-credential.md)
- [ ] **Retries on `TOO_MANY_REQUESTS`** for bulk sends — [Errors & Limits](../sdks/learncard-network/errors-and-limits.md)

## Trust

- [ ] **Issuer profile has a real name and logo** — it's what recipients see in the claim email and wallet
- [ ] **Listed as a trusted issuer** so recipients don't see an unverified-issuer notice — [Get Listed as a Trusted Issuer](verify-my-issuer.md)

## Support

- [ ] **Someone on your team watches** [GitHub issues](https://github.com/learningeconomy/LearnCard/issues) or has [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) — and knows to tell us which issuer you are

When every box is checked, switch `recipient` from your test address to real ones.

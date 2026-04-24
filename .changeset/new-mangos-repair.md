---
"learn-card-app": patch
"@learncard/email-templates": patch
"@learncard/lca-api-service": patch
"@learncard/network-brain-service": patch
"@learncard/sss-key-manager": patch
---

feat: [LC-1749] React-Email + Tenant Branding

Introduces git-managed, tenant-branded email and SMS templates via the new `@learncard/email-templates` package, and wires tenant-aware email delivery through `lca-api` and `brain-service`.

### What's new

- **`@learncard/email-templates` (new package)** — React Email templates for every transactional email the platform sends (login OTP, recovery email code, recovery key, inbox claim, endorsement request, guardian approval, account approved, guardian credential approval, etc.). Includes an SMS renderer, a tenant registry with per-tenant branding overrides, and a local preview server (`pnpm --filter @learncard/email-templates dev`).
- **`lca-api` + `brain-service`** — PostmarkAdapter now renders templates locally with tenant branding and delivers the result as raw HTML via Postmark's `sendEmail` API. Tenant is resolved from the request in `createContext` via `resolveTenantFromRequest()` and attached as `ctx.tenant` for every route.
- **`@learncard/sss-key-manager`** — `createSSSStrategy({ tenantId })` now forwards an `X-Tenant-Id` header on every call to `lca-api` so recovery / OTP emails are branded for the tenant the user is signed into.
- **`learn-card-app`** — Resolves the active tenant at SSS factory time and passes it into `createSSSStrategy`, so VetPass (and any future tenant) gets branded recovery emails out of the box.

### Behavior changes

- **Recovery / OTP emails are always branded.** Previously, emails fell back to unstyled plain-text when the corresponding `POSTMARK_*_TEMPLATE_ALIAS` env var was unset. The server now renders the React Email template with tenant branding on every send; unset env vars are fine.
- **New observable request header.** The SSS client sends `X-Tenant-Id: <tenant>` on all requests to `lca-api`. Proxies, WAFs, and log pipelines may surface this.

### Deployment notes (self-hosters)

- The `POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS` and `POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS` env vars are no longer required — they're pure overrides now. You can remove them from your deployment config.
- `POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS` and `POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS` are likewise optional overrides; the adapter renders locally by default.
- An optional `DEFAULT_TENANT_ID` env var is now honored as the fallback when neither `X-Tenant-Id` nor `Origin` resolves to a known tenant.
- Existing Postmark template customizations are not used unless the corresponding env var is set. To move your branding into version control, add an entry to `TENANT_EMAIL_BRANDING` in `packages/email-templates/src/tenant-registry.ts`.

See [Configure Tenant-Branded Emails](../docs/how-to-guides/configure-tenant-branded-emails.md) and [Tenant-Branded Emails (architecture)](../docs/core-concepts/tenant-branded-emails.md) for details.

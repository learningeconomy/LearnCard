---
description: Add a new tenant to LearnCard's transactional emails so recovery, OTP, and notification emails ship with your brand name, logo, colors, and from-domain
---

# Configure Tenant-Branded Emails

LearnCard's transactional emails (login OTP, recovery email code, recovery key, inbox claim, endorsement request, guardian approval, etc.) are rendered by [`@learncard/email-templates`](https://github.com/learningeconomy/LearnCard/tree/main/packages/email-templates) and branded per-tenant at send time. This guide walks you through adding a new tenant end-to-end.

{% hint style="info" %}
This is the operator-facing guide. For the architecture and data flow, see [Tenant-Branded Emails](../core-concepts/tenant-branded-emails.md).
{% endhint %}

## What gets branded

Every outbound email carries your tenant's:

- **Brand name** — subject lines, body copy, footer
- **Logo** — header image
- **Primary color** — CTA buttons, accents
- **Support email** — footer contact link
- **Website URL** — footer link
- **App URL** — CTA target URL (e.g. the claim link)
- **From domain** — `recovery@<your-domain>`, `notifications@<your-domain>`
- **Copyright holder** — footer

Missing fields fall back to LearnCard defaults.

## Prerequisites

- The tenant is already set up in `apps/learn-card-app/environments/<tenant>/` — see [the environments README](https://github.com/learningeconomy/LearnCard/blob/main/apps/learn-card-app/environments/README.md) for scaffolding a new tenant.
- You have access to open a PR against the repo (backend branding currently lives in source).

## Steps

### 1. Preview branding locally

Before wiring anything into the backend, render each template with your prospective branding to make sure logo, color, and copy look right in real email clients:

```bash
pnpm --filter @learncard/email-templates dev
```

This starts the react-email dev server at [http://localhost:3333](http://localhost:3333). Browse every template, switch between HTML and plain-text views, and verify your `primaryColor` contrasts well against white backgrounds.

Multi-scenario previews live in `packages/email-templates/src/previews/` — copy one and tweak the `branding` object to test your tenant.

### 2. Register the tenant in `tenant-registry.ts`

Open `@/packages/email-templates/src/tenant-registry.ts` and add your tenant to both maps:

```typescript
const ORIGIN_MAP: Record<string, string> = {
    // ... existing entries
    'mytenant.app': 'mytenant',
    'alpha.mytenant.app': 'mytenant',
    'staging.mytenant.app': 'mytenant',
};

const TENANT_EMAIL_BRANDING: Record<string, Partial<TenantBranding>> = {
    // ... existing entries
    mytenant: {
        brandName: 'MyTenant',
        logoUrl: 'https://mytenant.app/assets/icon/icon.png',
        logoAlt: 'MyTenant',
        primaryColor: '#1B5E20',
        primaryTextColor: '#ffffff',
        supportEmail: 'support@mytenant.app',
        websiteUrl: 'https://www.mytenant.app',
        appUrl: 'https://mytenant.app',
        fromDomain: 'mytenant.app',
        copyrightHolder: 'MyTenant',
    },
};
```

Guidelines:

- **`ORIGIN_MAP`** maps every hostname a browser might send as `Origin` / `Referer` to your canonical tenant ID. The resolver strips subdomains progressively, so registering `mytenant.app` will also match `foo.bar.mytenant.app`, but explicit entries are clearer.
- **`TENANT_EMAIL_BRANDING`** is partial — omit any field to fall back to the LearnCard default.
- **`logoUrl`** must be an absolute `https://` URL reachable from email clients. Relative paths do not work in email.
- **`fromDomain`** must be a domain you've verified in Postmark, otherwise mail will be rejected.

Add test coverage to `packages/email-templates/src/__tests__/tenant-registry.test.ts` asserting that both the `X-Tenant-Id: mytenant` header and an `Origin: https://mytenant.app` header resolve to your branding.

### 3. Register a preview preset

So future contributors can preview your tenant's emails without reverse-engineering your branding, add a preset to `@/packages/email-templates/src/previews/_fixtures.tsx`:

```typescript
export const MYTENANT_BRANDING: TenantBranding = resolveBranding({
    brandName: 'MyTenant',
    primaryColor: '#1B5E20',
    logoUrl: 'https://mytenant.app/assets/icon/icon.png',
    // ... rest
});
```

Then reference it in the scenario files under `src/previews/` so the dev server renders a `MyTenant` variant alongside LearnCard and VetPass.

### 4. Verify the client sends `X-Tenant-Id`

If your tenant uses the LearnCard App shell (`apps/learn-card-app`), this is already wired — the SSS strategy factory in `@/apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx` reads `getResolvedTenantConfig().tenantId` at construction time and forwards it on every request to `lca-api`.

If you're embedding the SSS client yourself, pass `tenantId` to `createSSSStrategy`:

```typescript
import { createSSSStrategy } from '@learncard/sss-key-manager';

const sssStrategy = createSSSStrategy({
    serverUrl: 'https://api.learncard.app/trpc',
    tenantId: 'mytenant',
});
```

The strategy will then send `X-Tenant-Id: mytenant` on every call to `lca-api`.

### 5. Set `DEFAULT_TENANT_ID` for server-to-server callers (optional)

When your tenant runs a separate backend process (cron jobs, event consumers, a dedicated lca-api deploy) that sends emails without receiving a client request, set the fallback env var:

```bash
DEFAULT_TENANT_ID=mytenant
```

This is used only when neither `X-Tenant-Id` nor `Origin` resolves. Requests that arrive with a header still win.

### 6. Deploy and verify

1. Merge the PR and deploy `lca-api` / `brain-service` with the updated `@learncard/email-templates` dependency.
2. Trigger a real email flow end-to-end — e.g. sign up a test user on `mytenant.app` and complete recovery email setup.
3. Inspect the Postmark "Activity" tab: the **From** should be `recovery@mytenant.app`, **Subject** should include "MyTenant", and the rendered HTML should show your logo and primary color.
4. If something looks LearnCard-branded, check the Postmark request payload for `X-Tenant-Id` — the SSS client only forwards it when the tenant config has `tenantId` set at boot time.

## Field reference

| Field | Appears in | Example |
|---|---|---|
| `brandName` | Subject lines, body copy, footer copyright | `"MyTenant"` |
| `logoUrl` | Header image in every email | `"https://mytenant.app/icon.png"` |
| `logoAlt` | Alt text for the header image | `"MyTenant"` |
| `primaryColor` | CTA button background, link accents | `"#1B5E20"` |
| `primaryTextColor` | CTA button text color | `"#ffffff"` |
| `supportEmail` | Footer "contact us" link | `"support@mytenant.app"` |
| `websiteUrl` | Footer website link | `"https://www.mytenant.app"` |
| `appUrl` | Base for CTA deep links | `"https://mytenant.app"` |
| `fromDomain` | `recovery@<domain>`, `notifications@<domain>` sender | `"mytenant.app"` |
| `copyrightHolder` | `© {year} {copyrightHolder}` in footer | `"MyTenant"` |

The full type lives in `@/packages/email-templates/src/branding.ts` as `TenantBranding`.

## Resolution priority

When a request arrives at `lca-api` or `brain-service`, the tenant is resolved in this order (first match wins):

1. **`X-Tenant-Id` header** — explicit, highest priority. Sent by native apps and any SSS client configured with `tenantId`.
2. **`Origin` / `Referer` header hostname** — looked up in `ORIGIN_MAP`, with progressive subdomain stripping.
3. **`DEFAULT_TENANT_ID` env var** — server-to-server callers.
4. **`'learncard'`** — final fallback.

The resolved tenant is attached to `ctx.tenant` in both services and passed as `branding: ctx.tenant.emailBranding` to `deliveryService.send()`.

## Troubleshooting

### Emails still show "LearnCard" for my tenant

Check, in order:

1. **Is `X-Tenant-Id` reaching the server?** Inspect the request in your server logs or Postmark request metadata. If absent, the client-side SSS strategy doesn't have `tenantId` set — verify `getResolvedTenantConfig().tenantId` returns your tenant ID at the point `createSSSStrategy` is called.
2. **Is the tenant in `TENANT_EMAIL_BRANDING`?** Unknown tenant IDs resolve to an empty branding object, so every field falls back to LearnCard defaults.
3. **Is the service pinned to an old version?** `brain-service` and `lca-api` both depend on `@learncard/email-templates` — make sure they've been rebuilt after your PR lands.
4. **Are you looking at a legacy Postmark-hosted template?** If `POSTMARK_*_TEMPLATE_ALIAS` env vars point to real Postmark aliases **and** local rendering throws, the adapter falls back to `sendEmailWithTemplate`, which uses Postmark's template engine (no tenant branding). Remove the env vars or fix the local rendering error.

### The `email` section of my tenant's `config.json` seems to be ignored

It is. `tenantEmailConfigSchema` exists in the schema but is **not yet read by the backend** — the source of truth is `TENANT_EMAIL_BRANDING` in the `@learncard/email-templates` package. Follow step 2 above to register your branding.

This is a known gap tracked as future work to let tenants override branding without a package change.

### Postmark returns "invalid From address"

Your `fromDomain` isn't verified in Postmark. Verify the domain in your Postmark account (SPF + DKIM DNS records), or point `fromDomain` at a domain you've already verified.

### New template I added isn't rendering

Confirm the template ID is both:

1. Registered in `TemplateDataMap` in `@/packages/email-templates/src/render.ts`
2. Mapped in `LOCAL_TEMPLATE_MAP` / `LOCAL_TEMPLATE_ALIASES` in the service's PostmarkAdapter

See the "Adding a New Template" section of the [`@learncard/email-templates` README](https://github.com/learningeconomy/LearnCard/blob/main/packages/email-templates/README.md).

## Related

- [Tenant-Branded Emails (architecture)](../core-concepts/tenant-branded-emails.md)
- [SSS Key Management Configuration](deploy-infrastructure/sss-key-management-config.md)
- [`@learncard/email-templates` README](https://github.com/learningeconomy/LearnCard/blob/main/packages/email-templates/README.md)

# @learncard/email-templates

Git-managed, tenant-branded email and SMS templates for LearnCard services.

Built with [react-email](https://react.email/) so templates are composable React components with full type safety, local preview, and PR-based review.

## Architecture

```
src/
  branding.ts                 — TenantBranding type, defaults, resolveBranding()
  render.ts                   — renderEmail(templateId, branding, data) → { html, text, subject }
  sms.ts                      — renderSms(templateId, branding, data) → string
  tenant-registry.ts          — server-side tenant resolution from request headers
  index.ts                    — barrel export

  components/
    Layout.tsx                — shared email wrapper (header, footer, branding)
    EmailButton.tsx           — branded CTA button
    CodeBlock.tsx             — verification code / recovery key display
    IssuerLogo.tsx            — issuer logo with fallback
    LinkFallback.tsx          — "copy and paste this link" fallback text

  templates/
    verification-code.tsx     — 3 variants: login, recovery-email, embed-verification
    email-verification.tsx    — link-based email verification (CTA button)
    inbox-claim.tsx           — credential claim notification
    endorsement-request.tsx   — endorsement request
    guardian-approval.tsx     — minor account approval request
    account-approved.tsx      — account approved confirmation
    recovery-key.tsx          — recovery key delivery
    guardian-credential-approval.tsx  — guardian approve/decline a credential
    credential-awaiting-guardian.tsx  — student: credential pending guardian
    guardian-approved-claim.tsx       — student: guardian approved credential
    guardian-rejected-credential.tsx  — student: guardian rejected credential
    guardian-email-otp.tsx            — guardian OTP verification

  previews/
    _fixtures.tsx             — shared branding presets and scenario divider
    inbox-claim-scenarios.tsx
    verification-code-scenarios.tsx
    endorsement-request-scenarios.tsx
    guardian-approval-scenarios.tsx
    guardian-credential-scenarios.tsx
    account-approved-scenarios.tsx
    recovery-key-scenarios.tsx

  __tests__/
    render.test.ts            — smoke, content, branding, subject, and edge-case tests
    sms.test.ts               — SMS rendering tests
    tenant-registry.test.ts   — tenant resolution unit tests
```

## Usage

```typescript
import { renderEmail, renderSms, resolveBranding } from '@learncard/email-templates';

// Render a branded email
const { html, text, subject } = await renderEmail('inbox-claim', tenantBranding, {
    claimUrl: 'https://vetpass.app/claim/abc123',
    credential: { name: 'Service Badge' },
    issuer: { name: 'VA Medical Center' },
});

// Render a branded SMS
const smsBody = renderSms('inbox-claim', tenantBranding, {
    claimUrl: 'https://vetpass.app/claim/abc123',
    credential: { name: 'Service Badge', type: 'Achievement' },
    issuer: { name: 'VA Medical Center' },
});
```

## Template IDs

| Template ID                       | Service       | Purpose                              |
| --------------------------------- | ------------- | ------------------------------------ |
| `login-verification-code`         | lca-api       | Login OTP code                       |
| `recovery-email-code`             | lca-api       | Recovery email verification          |
| `embed-email-verification`        | brain-service | Embed SDK email verification         |
| `contact-method-verification`     | brain-service | Link-based email verification        |
| `inbox-claim`                     | brain-service | Credential claim notification        |
| `endorsement-request`             | lca-api       | Endorsement request                  |
| `guardian-approval`               | brain-service | Guardian approval for minor accounts |
| `account-approved`                | brain-service | Account approved notification        |
| `recovery-key`                    | lca-api       | Recovery key delivery                |
| `credential-awaiting-guardian`    | brain-service | Student: credential pending guardian |
| `guardian-credential-approval`    | brain-service | Guardian: approve/decline credential |
| `guardian-approved-claim`         | brain-service | Student: guardian approved credential|
| `guardian-rejected-credential`    | brain-service | Student: guardian rejected credential|
| `guardian-email-otp`              | brain-service | Guardian OTP verification            |

Legacy Postmark aliases (`universal-inbox-claim`, `contact-method-verification-1`, `account-approved-email`, `recovery-key-backup`, `recovery-email-verification`, `universal-inbox-claim-1`) are also supported and map to the corresponding template above.

## Tenant Branding

Every field in `TenantBranding` is optional when calling `renderEmail` / `renderSms` — missing fields fall back to LearnCard defaults.

```typescript
interface TenantBranding {
    brandName: string;        // e.g. "VetPass"
    logoUrl: string;          // hosted logo image URL
    logoAlt: string;          // logo alt text
    primaryColor: string;     // hex, e.g. "#1B5E20"
    primaryTextColor: string; // hex, e.g. "#ffffff"
    supportEmail: string;     // footer support email
    websiteUrl: string;       // footer website link
    appUrl: string;           // base app URL for CTA links
    fromDomain: string;       // email from domain
    copyrightHolder: string;  // footer copyright name
}
```

Branding values are sourced from the tenant config's `email` section (see `tenantEmailConfigSchema` in `packages/learn-card-base/src/config/tenantConfigSchema.ts`).

## Tenant Resolution

`tenant-registry.ts` provides server-side tenant resolution from HTTP request headers:

1. **`X-Tenant-Id` header** — explicit tenant (native apps, informed clients)
2. **`Origin` / `Referer` header** — hostname mapping (web apps)
3. **`DEFAULT_TENANT_ID` env var** — per-tenant deploys, cron jobs
4. **Fallback** — `'learncard'`

```typescript
import { resolveTenantFromRequest } from '@learncard/email-templates';

const tenant = resolveTenantFromRequest(req.headers);
// { id: 'vetpass', emailBranding: { brandName: 'VetPass', ... }, resolvedVia: 'origin' }
```

## Integration

Both `brain-service` and `lca-api` PostmarkAdapters:

1. Check if the template ID maps to a known local template
2. If yes → render locally with tenant branding, send as raw HTML via Postmark
3. If rendering fails → fall back to Postmark's template engine (legacy path)

This makes migration gradual and backward-compatible. Call sites that don't pass `branding` get LearnCard defaults.

## Adding a New Template

1. Create `src/templates/my-template.tsx` — export the component + a `getMyTemplateSubject()` function
2. Define the data interface in `src/render.ts` and add it to `TemplateDataMap`
3. Add a case to `buildElement()` in `src/render.ts`
4. Export from `src/templates/index.ts` and `src/index.ts`
5. Map the old template ID to the new one in the service's PostmarkAdapter (`LOCAL_TEMPLATE_MAP`)
6. Add test fixtures and assertions to `src/__tests__/render.test.ts`
7. Run `pnpm --filter @learncard/email-templates test` and `typecheck` to verify

## Previewing Templates

The package includes a built-in dev server powered by [react-email](https://react.email/):

```bash
pnpm --filter @learncard/email-templates dev
```

This starts a hot-reloading UI at **http://localhost:3333** where you can:

- Browse all templates in a sidebar
- See a live preview with sample data
- Toggle between HTML, plain text, and source views
- Copy the rendered HTML for testing in email clients

Each template file has a `default` export with realistic sample data used for previews. Multi-scenario previews in `src/previews/` show templates with different branding and data combinations.

## Testing

Tests use [Vitest](https://vitest.dev/) and cover:

- **Smoke tests** — every template ID renders without throwing (default, custom, and empty branding)
- **Content assertions** — dynamic values (URLs, codes, names) appear in rendered HTML
- **Branding tests** — custom branding flows through to output (colors, brand name, URLs)
- **Subject line tests** — correct subjects, alias parity
- **Plain text tests** — no HTML tags in plain text output
- **Edge cases** — minimal data, missing optional fields
- **SMS tests** — `renderSms` output strings with branding
- **Tenant resolution** — header priority, origin mapping, env fallback, registration helpers

## Scripts

```bash
pnpm --filter @learncard/email-templates dev          # Preview templates in browser
pnpm --filter @learncard/email-templates typecheck    # Type check
pnpm --filter @learncard/email-templates test         # Run tests (vitest run)
pnpm --filter @learncard/email-templates test:watch   # Run tests in watch mode
```

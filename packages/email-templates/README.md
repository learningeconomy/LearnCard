# @learncard/email-templates

Git-managed, tenant-branded email and SMS templates for LearnCard services.

Built with [react-email](https://react.email/) so templates are composable React components with full type safety, local preview, and PR-based review.

## Architecture

```
src/
  branding.ts                 — TenantBranding type, defaults, resolveBranding()
  render.ts                   — renderEmail(templateId, branding, data) → { html, text, subject }
  sms.ts                      — renderSms(templateId, branding, data) → string
  index.ts                    — barrel export

  components/
    Layout.tsx                — shared email wrapper (header, footer, branding)
    EmailButton.tsx           — branded CTA button
    CodeBlock.tsx             — verification code / recovery key display

  templates/
    verification-code.tsx     — 4 variants: login, recovery-email, embed, contact-method
    inbox-claim.tsx           — credential claim notification
    guardian-approval.tsx     — minor account approval request
    account-approved.tsx      — account approved confirmation
    recovery-key.tsx          — recovery key delivery
    endorsement-request.tsx   — endorsement request
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

| Template ID                    | Service       | Purpose                              |
| ------------------------------ | ------------- | ------------------------------------ |
| `login-verification-code`      | lca-api       | Login OTP code                       |
| `recovery-email-code`          | lca-api       | Recovery email verification          |
| `embed-email-verification`     | brain-service | Embed SDK email verification         |
| `contact-method-verification`  | brain-service | Contact method verification          |
| `inbox-claim`                  | brain-service | Credential claim notification        |
| `guardian-approval`            | brain-service | Guardian approval for minor accounts |
| `account-approved`             | brain-service | Account approved notification        |
| `recovery-key`                 | lca-api       | Recovery key delivery                |
| `endorsement-request`          | lca-api       | Endorsement request                  |

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
4. Export from `src/templates/index.ts`
5. Map the old template ID to the new one in the service's PostmarkAdapter (`LOCAL_TEMPLATE_MAP`)
6. Run `pnpm --filter @learncard/email-templates typecheck` to verify

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

Each template file has a `default` export with realistic sample data used for previews. To customize the preview data, edit the `Preview()` function at the bottom of the template file.

## Scripts

```bash
pnpm --filter @learncard/email-templates dev          # Preview templates in browser
pnpm --filter @learncard/email-templates typecheck    # Type check
pnpm --filter @learncard/email-templates test         # Run tests
```

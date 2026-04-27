# Email Templates - AI Assistant Guide

## Package Overview

`@learncard/email-templates` provides git-managed, tenant-branded email and SMS templates for LearnCard services. Built with [react-email](https://react.email/), templates are composable React components with full type safety, local preview, and PR-based review.

## Architecture

### Core Modules

-   **`render.ts`**: Main entry point — `renderEmail(templateId, branding, data)` → `{ html, text, subject }`
-   **`sms.ts`**: SMS rendering — `renderSms(templateId, branding, data)` → `string`
-   **`branding.ts`**: `TenantBranding` interface, `DEFAULT_BRANDING`, `resolveBranding()`
-   **`tenant-registry.ts`**: Server-side tenant resolution from HTTP request headers
-   **`index.ts`**: Barrel export for all public APIs

### Template Components (`src/templates/`)

Each template file exports:

1. A **React component** (e.g., `InboxClaim`)
2. A **subject getter** function (e.g., `getInboxClaimSubject()`)
3. A **Props interface** (e.g., `InboxClaimProps`)
4. A **default export** `Preview()` function for the react-email dev server

### Shared Components (`src/components/`)

-   **`Layout.tsx`**: Shared email wrapper (header with logo, branded footer, copyright)
-   **`EmailButton.tsx`**: Branded CTA button using `primaryColor`
-   **`CodeBlock.tsx`**: Monospaced code/key display block
-   **`IssuerLogo.tsx`**: Issuer logo with fallback
-   **`LinkFallback.tsx`**: "Copy and paste this link" fallback text below CTA buttons

### Rendering Pipeline

```
Service call → renderEmail(templateId, branding, data)
                 ↓
              resolveBranding(partial) → full TenantBranding
                 ↓
              buildElement(templateId, branding, data) → { element, subject }
                 ↓
              @react-email/render(element) → html + plainText
                 ↓
              { html, text, subject }
```

### Tenant Resolution Priority

`resolveTenantFromRequest(headers)` resolves in order:

1. `X-Tenant-Id` header (explicit, highest priority)
2. `Origin` / `Referer` header hostname (web apps)
3. `DEFAULT_TENANT_ID` env var (per-tenant deploys)
4. Fallback to `'learncard'`

## Development Guidelines

### When to Modify This Package

-   Adding or updating email/SMS templates
-   Adding new tenant branding overrides
-   Adding new origin → tenant mappings
-   Updating shared Layout, button, or component styles
-   Adding new template IDs to `TemplateDataMap`

### When NOT to Modify This Package

-   Changing how emails are *sent* (that's in PostmarkAdapter in brain-service/lca-api)
-   Adding business logic around when to send emails (belongs in service routes)
-   Modifying Postmark API configuration (belongs in service adapters)

### Code Style

-   **No Tailwind** — email templates use **inline `React.CSSProperties`** for email client compatibility
-   **Color palette**: background `#f3f4f6`, heading `#111827`, body `#374151`, muted `#6b7280`, border `#e5e7eb`
-   **Button color**: Uses `branding.primaryColor` (default indigo `#6366f1`) — never hardcode
-   **All templates** must accept a `branding: TenantBranding` prop and use it for brand name, colors, URLs, and copy
-   **No `any` types** — use the specific data interfaces from `render.ts`
-   **Arrow functions** with explicit return types for exported utilities
-   **JSDoc comments** on all exported functions and interfaces

### Email-Specific Constraints

-   **Inline styles only** — email clients strip `<style>` tags; always use `style={}` props
-   **No CSS Grid or Flexbox** — use `@react-email/components` `Section`, `Row`, `Column` for layout
-   **Images need absolute URLs** — relative paths won't work in email
-   **Test in plain text** — `renderEmail` produces both HTML and plain text; content must be readable in both
-   **Link fallback** — always include `<LinkFallback href={...} />` below CTA buttons for clients that strip buttons

### Template ID Conventions

-   Primary IDs match the service call site (e.g., `'inbox-claim'`, `'guardian-approval'`)
-   Legacy Postmark aliases (e.g., `'universal-inbox-claim'`, `'account-approved-email'`) are supported via the `buildElement` switch and map to the same component
-   The `TemplateDataMap` interface in `render.ts` is the source of truth for all valid template IDs

### Verification Templates: Code vs. Link

Two distinct patterns exist:

-   **Code-based** (`VerificationCode`): Displays a 6-digit OTP code in a `CodeBlock`. Used by `login-verification-code`, `recovery-email-code`, `embed-email-verification`, `guardian-email-otp`.
-   **Link-based** (`EmailVerification`): Displays a CTA button linking to `{appUrl}/verify-email?token={uuid}`. Used by `contact-method-verification`.

Never mix these — `contact-method-verification` receives a UUID token, not a 6-digit code.

## Common Tasks

### Adding a New Email Template

1. Create `src/templates/my-template.tsx`:
    - Export the component, props interface, and `getMyTemplateSubject()` function
    - Export a `default Preview()` function with realistic sample data
2. Export from `src/templates/index.ts`
3. In `src/render.ts`:
    - Define the data interface (e.g., `MyTemplateData`)
    - Add entry to `TemplateDataMap`
    - Add case to `buildElement()` switch
4. Export the data type from `src/index.ts`
5. Map the template ID in the service's PostmarkAdapter (`LOCAL_TEMPLATE_MAP`)
6. Add test fixtures and assertions to `src/__tests__/render.test.ts`
7. Run `pnpm test` and `pnpm typecheck`

### Adding a New Tenant

1. Add origin mappings to `ORIGIN_MAP` in `tenant-registry.ts`
2. Add branding overrides to `TENANT_EMAIL_BRANDING` in `tenant-registry.ts`
3. Add test cases to `src/__tests__/tenant-registry.test.ts`
4. Add a branding preset to `src/previews/_fixtures.tsx` for preview scenarios

### Adding a Multi-Scenario Preview

1. Create `src/previews/my-template-scenarios.tsx`
2. Import `ScenarioDivider` and branding presets from `./_fixtures`
3. Render multiple instances of the template with different data/branding combos
4. The react-email dev server auto-discovers files in `src/`

## Build & Test Commands

-   **Preview**: `pnpm --filter @learncard/email-templates dev` (opens http://localhost:3333)
-   **Type check**: `pnpm --filter @learncard/email-templates typecheck`
-   **Test**: `pnpm --filter @learncard/email-templates test`
-   **Test (watch)**: `pnpm --filter @learncard/email-templates test:watch`

## Testing Strategy

Tests live in `src/__tests__/` and use Vitest:

-   **`render.test.ts`**: Smoke tests (every template ID × 3 branding variants), content assertions, branding flow-through, subject lines, plain text, edge cases
-   **`sms.test.ts`**: SMS output strings with branding
-   **`tenant-registry.test.ts`**: Header priority, origin mapping, subdomain stripping, env fallback, registration helpers

### When Adding a New Template

Add to `TEMPLATE_FIXTURES` in `render.test.ts` with minimal valid data. The smoke tests will automatically cover it across all branding variants. Then add specific content assertions for the template's dynamic values.

### Test Invariants

-   Every `TemplateId` in `TemplateDataMap` must have a fixture in `TEMPLATE_FIXTURES`
-   Every template must render non-empty `html`, `text`, and `subject`
-   Custom branding (brand name, primary color, support email) must appear in rendered output
-   Plain text output must not contain HTML tags
-   Dynamic values (URLs, codes, names) must appear in rendered HTML

## Integration with Services

### brain-service (`services/learn-card-network/brain-service/`)

-   PostmarkAdapter in `src/services/delivery/adapters/postmark.adapter.ts`
-   `LOCAL_TEMPLATE_MAP` maps Postmark aliases → local template IDs
-   `mapTemplateModel()` transforms the service's `templateModel` into the shape expected by `TemplateDataMap`

### lca-api (`services/learn-card-network/lca-api/`)

-   PostmarkAdapter in `src/services/delivery/adapters/postmark.adapter.ts`
-   Uses `inferLocalTemplateId()` heuristic to detect template type from model shape
-   Same `mapTemplateModel()` pattern as brain-service

### Adapter Integration Pattern

Both adapters:

1. Try to map the Postmark template alias to a local template ID
2. If matched → render locally via `renderEmail()`, send as raw HTML via Postmark's `sendEmail()`
3. If rendering fails → fall back to Postmark's template engine (legacy `sendEmailWithTemplate()`)

## Troubleshooting

### Common Issues

1. **Template renders but content is missing**
    - Check that `mapTemplateModel()` in the service adapter correctly maps the model fields
    - Verify the data interface in `render.ts` matches what the adapter produces

2. **Brand name shows "LearnCard" for a custom tenant**
    - Check `TENANT_EMAIL_BRANDING` in `tenant-registry.ts`
    - Verify the service passes `branding` to the adapter's `send()` method
    - Check `resolveBranding()` is called before rendering

3. **react-email dev server ENOENT errors**
    - The dev server scans `src/` recursively — ensure no broken symlinks or references to deleted directories
    - Non-React files (`.ts` without JSX) are fine; only `.tsx` files with default exports show as previews

4. **Verification email shows a code instead of a link (or vice versa)**
    - `contact-method-verification` → link-based (`EmailVerification` component, expects `verificationToken`)
    - `embed-email-verification` / `login-verification-code` / `recovery-email-code` → code-based (`VerificationCode` component, expects `verificationCode`)
    - Check the adapter's `mapTemplateModel()` switch case for the correct mapping

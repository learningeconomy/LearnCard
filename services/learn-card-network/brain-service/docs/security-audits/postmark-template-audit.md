# Postmark Email Template Security Audit

**Phase:** E2EE Hardening — Phase 0.4  
**Date:** 2026-05-22  
**Auditor:** Automated (Sisyphus)  
**Scope:** All email templates that pass a `credential` field in their `templateModel`

---

## Summary

All locally-rendered email templates in `postmark.adapter.ts` are **safe**: they only render allow-listed display fields (`credential.name`, `credential.type`) from the `credential` object. No template renders raw `credentialSubject`, `proof`, `evidence`, or any other sensitive cryptographic field.

However, the `templateModel` is passed as a raw `Record<string, any>` from callers, meaning a caller could accidentally include a full VC object. A runtime guard (`scrubTemplateModel`) has been added as defence-in-depth to strip sensitive fields before the model reaches either the local renderer or the Postmark fallback API.

---

## Template Inventory

### Templates with `credential` field

| Template ID | Postmark Alias | `credential` fields rendered | Verdict |
|---|---|---|---|
| `inbox-claim` | `universal-inbox-claim` | `credential.name`, `credential.type` | ✅ Safe |
| `guardian-credential-approval` | `guardian-credential-approval` | `credential.name` | ✅ Safe |
| `credential-awaiting-guardian` | `credential-awaiting-guardian` | `credential.name` | ✅ Safe |
| `guardian-approved-claim` | `guardian-approved-claim` | `credential.name` | ✅ Safe |
| `guardian-rejected-credential` | `guardian-rejected-credential` | `credential.name` | ✅ Safe |
| `endorsement-request` | `endorsement-request` | `credential.name`, `credential.type` | ✅ Safe |

### Templates without `credential` field

| Template ID | Postmark Alias | Verdict |
|---|---|---|
| `guardian-approval` | `guardian-approval` | ✅ Safe (no credential data) |
| `account-approved` | `account-approved-email` | ✅ Safe (no credential data) |
| `embed-email-verification` | `embed-email-verification` | ✅ Safe (no credential data) |
| `contact-method-verification` | `contact-method-verification` | ✅ Safe (no credential data) |
| `guardian-email-otp` | `guardian-email-otp` | ✅ Safe (no credential data) |

---

## Detailed Template Analysis

### `inbox-claim`

**File:** `packages/email-templates/src/templates/inbox-claim.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
    type?: string;
}
```

**Rendered fields:** `credential.name` (credential display name), `credential.type` (e.g. "Achievement", "record")

**Verdict:** ✅ Safe — only display fields rendered.

---

### `guardian-credential-approval`

**File:** `packages/email-templates/src/templates/guardian-credential-approval.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
}
```

**Rendered fields:** `credential.name` only

**Verdict:** ✅ Safe — only display fields rendered.

---

### `credential-awaiting-guardian`

**File:** `packages/email-templates/src/templates/credential-awaiting-guardian.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
}
```

**Rendered fields:** `credential.name` only

**Verdict:** ✅ Safe — only display fields rendered.

---

### `guardian-approved-claim`

**File:** `packages/email-templates/src/templates/guardian-approved-claim.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
}
```

**Rendered fields:** `credential.name` only

**Verdict:** ✅ Safe — only display fields rendered.

---

### `guardian-rejected-credential`

**File:** `packages/email-templates/src/templates/guardian-rejected-credential.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
}
```

**Rendered fields:** `credential.name` only

**Verdict:** ✅ Safe — only display fields rendered.

---

### `endorsement-request`

**File:** `packages/email-templates/src/templates/endorsement-request.tsx`

**Props interface:**
```typescript
credential?: {
    name?: string;
    type?: string;
}
```

**Rendered fields:** `credential.name` (for display in body text), `credential.type` (not currently rendered in body but present in props)

**Verdict:** ✅ Safe — only display fields rendered.

---

## Allow-listed Fields

The following fields are the complete set of credential-related fields that templates are permitted to render:

| Field | Purpose |
|---|---|
| `credential.name` | Human-readable credential name |
| `credential.type` | Credential type label (e.g. "Achievement") |
| `credential.achievementName` | Alternative name field for OBv3 achievements |
| `credential.boostName` | Alternative name field for LearnCard boosts |
| `issuer.name` | Issuer display name |
| `issuer.logoUrl` | Issuer logo URL |
| `recipient.name` | Recipient display name |
| `recipient.email` | Recipient email address |
| `claimUrl` | Claim action URL |
| `approvalUrl` | Guardian approval URL |
| `verificationCode` | OTP verification code |
| `verificationToken` | Email verification token |

---

## Runtime Guard Implementation

A `scrubTemplateModel` function has been added to `postmark.adapter.ts` as defence-in-depth. It runs on `notification.templateModel` before the model is passed to either:

1. `mapTemplateModel()` → `renderEmail()` (local rendering path)
2. `sendEmailWithTemplate()` (Postmark fallback path)

### What it strips

**Top-level sensitive keys** (removed entirely from the model):
- `credentialSubject`
- `proof`
- `evidence`
- `verifiableCredential`
- `verifiablePresentation`
- `presentation`
- `@context`

**`credential` object** (allow-list filter — only these keys survive):
- `name`
- `type`
- `achievementName`
- `boostName`

### What it preserves

All other top-level keys are passed through unchanged, including:
- `issuer` (display object with `name`, `logoUrl`)
- `recipient` (display object with `name`, `email`)
- `claimUrl`, `approvalUrl`, `shareLink`
- `verificationCode`, `verificationToken`
- `message`, `approvalToken`

---

## Findings

### No Unsafe Templates Found

All audited templates are safe. No template renders `credentialSubject`, `proof`, `evidence`, or any raw VC JSON.

### Residual Risk (Mitigated)

The `templateModel` is typed as `Record<string, any>`, so callers could theoretically pass a full VC object as the `credential` field. This risk is mitigated by the `scrubTemplateModel` runtime guard added in this phase.

### Recommendations

1. **Completed:** Add `scrubTemplateModel` runtime guard in `postmark.adapter.ts` — done.
2. **Future:** Consider tightening the `Notification.templateModel` type to a discriminated union per template ID, eliminating the `any` escape hatch at the type level.
3. **Future:** Add a unit test that passes a full VC object as `credential` and asserts that `scrubTemplateModel` strips `credentialSubject`, `proof`, and `evidence`.

---

## Files Changed

| File | Change |
|---|---|
| `src/services/delivery/adapters/postmark.adapter.ts` | Added `CREDENTIAL_SENSITIVE_KEYS`, `CREDENTIAL_ALLOWED_KEYS`, `scrubCredentialObject`, `scrubTemplateModel`; applied `scrubTemplateModel` to both the local render path and the Postmark fallback path |

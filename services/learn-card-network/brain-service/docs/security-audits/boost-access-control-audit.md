# Boost Access Control Security Audit

**Phase:** E2EE Hardening — Phase 0.6  
**Date:** 2026-05-22  
**Auditor:** Automated (Sisyphus)  
**Scope:** Boost visibility checks in `canProfileViewBoost`, claim-link visibility defaults, and `/storage/resolve`

---

## Summary

Three critical access-control issues were fixed in brain-service boost resolution paths:

1. `canProfileViewBoost()` no longer treats missing `defaultRole.canView` as public.
2. `isBoostViewableByClaimLink()` now defaults to `false` when no explicit `canView` setting exists.
3. `/storage/resolve` now blocks unauthenticated access to non-`LIVE` boosts before claim-link resolution.

These changes close a path where legacy or partially configured boosts could expose `DRAFT` or `PROVISIONAL` content to unauthenticated callers.

---

## Fixes Applied

### 1. `canProfileViewBoost()` unsafe default removed

**File:** `src/accesslayer/boost/relationships/read.ts`

**Before:** `defaultRole?.properties?.canView ?? true`

**After:** `defaultRole?.properties?.canView ?? false`

**Why:** Missing `canView` should not imply public visibility. Default-deny prevents draft/provisional boosts from being treated as viewable unless explicitly configured.

---

### 2. `isBoostViewableByClaimLink()` now defaults to deny

**File:** `src/helpers/boost.helpers.ts`

**Before:** boosts without an explicit `canView` setting returned `true`

**After:** boosts without an explicit `canView` setting return `false`

**Why:** Claim-link visibility is effectively public access gated by possession of a challenge. Legacy permissive defaults allowed claim-link exposure without an explicit visibility decision.

---

### 3. `/storage/resolve` blocks unauthenticated non-`LIVE` boost access

**File:** `src/routes/storage.ts`

**Change:** Added a guard in both cached and uncached boost resolution paths:

```typescript
if (!ctx.user && instance.status !== BoostStatus.enum.LIVE) {
    throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Boost is not publicly accessible.',
    });
}
```

**Why:** Even with claim-link checks, unauthenticated requests should never resolve `DRAFT` or `PROVISIONAL` boosts. This makes `LIVE` the only public status.

---

## Security Impact

- `DRAFT` boosts are no longer exposed by permissive legacy defaults.
- `PROVISIONAL` boosts are no longer resolvable anonymously.
- Existing `LIVE` boost claim-link flows remain intact.
- Authenticated users with explicit access still flow through the existing `canProfileViewBoost()` checks.

---

## Deferred / Remaining Work

The following issues were identified but intentionally deferred to later phases:

- Rate-limiting improvements for public resolution / claim-link abuse scenarios
- HMAC validation hardening for claim-link or related public-access flows

These were not changed in Phase 0.6 to keep the fix set scoped to the three critical authorization defaults above.

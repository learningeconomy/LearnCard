# Revocation / Suspension Follow-ups — Design Spec

**Tickets:** [LC-1894](https://welibrary.atlassian.net/browse/LC-1894) (Followup: support for revocation for suspension of credentials) · [LC-1913](https://welibrary.atlassian.net/browse/LC-1913) (End-User Experience when credential is revoked)
**Parent:** LC-1862 / PR #1271 (added issuer-facing FE revoke/suspend/unsuspend)
**Date:** 2026-07-07
**Assignee:** Donny Cheng

## Summary

PR #1271 (LC-1862) shipped the **issuer-facing** frontend for the credential revocation/suspension lifecycle. Two follow-up tickets remain:

-   **LC-1894** — issuer/backend gaps discovered during LC-1862: suspension isn't externally verifiable, the sidebar summary lacks a revoked count, and the activity views aren't react-query (so lifecycle mutations don't auto-refresh them).
-   **LC-1913** — the **holder-facing** UX: how a revoked/suspended credential looks and behaves in the wallet, and notifying the holder when an issuer revokes/suspends.

This is one combined spec with two workstreams (A: issuer/backend, B: holder UX). They are separable into coordinated PRs.

## Decisions (locked during brainstorming)

| #     | Decision                          | Choice                                                                                                                                       |
| ----- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope | Structure                         | One combined spec, both tickets                                                                                                              |
| A1    | Suspension external verifiability | **Flip global issuance default** to include `suspension` (implement now; heads-up to Taylor advised — changes every newly-issued credential) |
| A2    | 25-recipient status coverage      | Verify already resolved by PR #1271; no new code expected                                                                                    |
| B1    | Holder notification               | **Yes** — notify holder on internal revoke/suspend (external status-list revokes can't be observed)                                          |
| B2    | Status detection for thumbnails   | **Lazy per-thumbnail check** as cards render, cached                                                                                         |
| B3    | Thumbnail visual treatment        | Inline seal-badge swap + colored status pill (red/orange) + desaturated card                                                                 |
| B4    | Earned tab                        | Revoked/suspended creds **stay in place**, styled                                                                                            |

---

## Workstream A — LC-1894 (Issuer / Backend)

### A1. Suspension external verifiability — flip global default

**Problem:** A suspended credential currently verifies as `Status: Not Revoked` because the suspension status-list entry is never allocated at issuance. A VC is immutable at issuance, so both status entries must be allocated up front. Today only `revocation` is allocated by default.

**Change:** In `appendBitstringStatusListEntries`
([status-list.helpers.ts:302-333](../../../services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts)),
change the default `statusPurposes` parameter from `['revocation']` to `['revocation', 'suspension']`. All issuance call sites (`boosts.ts` lines ~935, ~1064, ~1270, ~3724) call this helper without passing `statusPurposes`, so they inherit the new default. The helper already skips purposes a credential already has (`alreadyHasPurpose` guard), so this is idempotent.

**Effects:**

-   Every newly-issued VC2 credential gets both `revocation` and `suspension` `BitstringStatusListEntry`s → suspension becomes externally verifiable.
-   Only affects **new** issuances (existing creds are immutable).
-   Slightly larger credentials; a second status-list allocation per issuance.

**Coordination:** This is a product-visible default change. Give Taylor (#1223 author) a heads-up before merge, but it is in-scope to implement now.

**Docs:** Update any docs stating suspension is opt-in via `sendBoost(..., { statusPurposes: [...] })`.

### A2. 25-recipient status coverage — verify only

**Problem (as filed):** The issuance list's status overlay was historically capped at 25 recipients/boost via `getBoostRecipients`.

**Finding:** PR #1271 moved status to a **per-instance** `credStatus` read directly off the `CREDENTIAL_SENT`/`CREDENTIAL_RECEIVED` relationship on each activity record (see `getActivitiesForProfile` in [credential-activity/read.ts](../../../services/learn-card-network/brain-service/src/accesslayer/credential-activity/read.ts)), which is exactly the "robust fix" the ticket proposed. This removes the 25-recipient overlay cap.

**Action:** Confirm with a test that status is correct for a boost with >25 recipients. Expected outcome: no new code. If a real gap surfaces, fold the fix into this workstream.

### A3. Revoked / suspended count in sidebar summary

**Problem:** `getActivityStatsForProfile`
([read.ts:203-347](../../../services/learn-card-network/brain-service/src/accesslayer/credential-activity/read.ts))
computes counts purely from `latestEvent.eventType` (`created`/`delivered`/`claimed`/`expired`/`failed`). Revoked/suspended status lives on the credential relationship (`credStatus`), which this query never joins — so the summary can't show a revoked count.

**Change:**

1. In `getActivityStatsForProfile`, after deriving the latest event per `activityId`, join the credential relationship the same way `getActivitiesForProfile` does (`OPTIONAL MATCH (sender)-[sent:CREDENTIAL_SENT { activityId }]->(cred:Credential)` → `coalesce(sent.status, received.status) AS credStatus`) and `SUM` `revoked` / `suspended` counts.
2. Extend `CredentialActivityStats` (in `types/activity`) with `revoked: number` and `suspended: number`.
3. Surface the counts in `IssuancesSummary`
   ([IssuancesSummary.tsx](../../../apps/learn-card-app/src/components/issuances/IssuancesSummary.tsx)).

**Note:** `credStatus` is per-instance; the stats query groups by `activityId` (latest event). Ensure the join is against the same instance the latest event refers to, consistent with `getActivitiesForProfile`.

### A4. Migrate `useIntegrationActivity` to react-query

**Problem:** The credential-activity views (`useIntegrationActivity` → `IssuanceList`, `IssuancesSummary`, App Store Developer dashboard Overview) are bespoke local-state fetchers, not react-query. The lifecycle mutations (`useRevokeBoostRecipient`/`useSuspendBoostRecipient`/`useUnsuspendBoostRecipient`) **are** react-query but their invalidations (`boostRecipients`, `getPaginatedBoostRecipients`, `getBoostRecipientCount`, `boosts`) can't reach the activity views. LC-1862 worked around this with an optimistic `statusOverride` + `onActionComplete`/`refreshKey` callback plumbing.

**Change:**

1. Migrate `useIntegrationActivity`
   ([hook](../../../apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity.ts))
   to react-query `useInfiniteQuery` (cursor-paginated via `getMyActivities`; stats via `getActivityStats`).
2. Add `['getMyActivities']` and `['getActivityStats']` to the `onSuccess` invalidations of the three lifecycle mutations at
   [mutations.ts:507 / 554 / 596](../../../packages/learn-card-base/src/react-query/mutations/mutations.ts).
3. Remove the now-redundant `onActionComplete` callback and `refreshKey` prop from `IssuanceList` / `IssuanceDetailModal`.

**Acceptance:** Revoke/suspend/unsuspend from either surface (dashboard + Managed tab) refreshes the activity list, stats, **and** the Managed-tab `IssuancesSummary` card with no hard refresh and no manual callback. Pagination (load-more) and existing filters still work.

---

## Workstream B — LC-1913 (Holder / End-User UX)

### B1. Holder notification on internal revoke/suspend

**Scope:** Internal (LearnCard-issuer) revoke/suspend/unsuspend only. External status-list revocations are not observable by us and are out of scope.

**Change:**

1. Add notification types to `LCNNotificationTypeEnumValidator`
   ([lcn.ts:896](../../../packages/learn-card-types/src/lcn.ts)): `CREDENTIAL_REVOKED`, `CREDENTIAL_SUSPENDED`, `CREDENTIAL_UNSUSPENDED`.
2. Emit via `addNotificationToQueue`
   ([notifications.helpers.ts](../../../services/learn-card-network/brain-service/src/helpers/notifications.helpers.ts))
   in the route handlers `revokeBoostRecipient` / `suspendBoostRecipient` / `unsuspendBoostRecipient`
   ([boosts.ts:1905 / 2001 / 2088](../../../services/learn-card-network/brain-service/src/routes/boosts.ts)),
   addressed to the recipient profile. Follow existing call-site patterns (e.g. `ISSUANCE_CLAIMED`).

**Error handling:** Notification emission is fire-and-forget and must **not** fail the revoke/suspend/unsuspend action if the queue/webhook errors.

### B2. Status detection for thumbnails — lazy per-thumbnail, cached

**Change:** Each credential card checks its own status when it renders (scrolls into view), reusing the existing `wallet.invoke.verifyCredential(...)` path already used by `useVerification` in `BoostPreview`
([BoostPreview.tsx:82](../../../apps/learn-card-app/src/components/boost/boostCMS/BoostPreview/BoostPreview.tsx)),
with results cached in `autoVerifyStore`
([autoVerifyStore.ts](../../../apps/learn-card-app/src/stores/autoVerifyStore.ts)).

**Properties:**

-   Covers both internal and external revocations (re-checks the actual status list).
-   No batch call on list load; no background/interval sweep.
-   Cheapest upfront; status "pops in" per card as it renders, then is cached.

**Error handling:** Status checks **fail open** — a verification error leaves the card in its last-known/active state; it must never render a credential as revoked on a transient check failure.

### B3. Thumbnail / card visual treatment

Design source: Figma node `2422:101057` ("Revoked Badge"), file `qNPuCYkYvjfGm1jXMFDQ0j`. SVG assets captured during brainstorming (red seal + white X; colors `red/600 #DC2626`, white `#FFFFFF`).

**Three elements, applied when a credential is revoked or suspended:**

1. **Inline seal-badge swap.** The credential card renders a small verified seal badge next to the issuer name (the green seal beside the issuer, under the title). Replace it per status:
    - Active → existing green verified seal (check).
    - Revoked → **red** seal (`#DC2626`) with a white **X** (the Figma "Revoked Badge").
    - Suspended → the **same X seal recolored orange** (`#EA580C`). Same silhouette, same slot.
2. **Top-left status pill.** A **colored** pill in the card's top-left corner reading **"Revoked"** / **"Suspended"**, white text. The pill matches the state color: red (`#DC2626`) for revoked, orange (`#EA580C`) for suspended. Top-left is chosen so it clears the existing "···" options menu in the top-right. The pill stays full-color on top of the desaturated card (it is not desaturated).
3. **Desaturated card.** The card art and text desaturate (grayscale) to read as inactive. The **badge and pill stay full-color / legible on top of the gray** (desaturation is scoped to art + text nodes, not the status overlays).

**Implementation notes:**

-   The seal is the same silhouette as the verified badge, so the natural approach is to extend the existing issuer-badge component with a `status` variant (`active | revoked | suspended`) rather than a new component. Pin the exact component during planning (holder credential card: `BoostEarnedCard` and its issuer row).
-   Suspended color (`#EA580C`, orange-600) is provisional — confirm the exact token with the designer.

### B4. Earned tab behavior

Revoked/suspended credentials **stay in the holder's "Earned" tab** in place, rendered with the B3 treatment. No move to a separate section, no filter toggle, no re-sort. The holder can still open and inspect them.

---

## Cross-cutting

### Data flow (end to end)

1. Issuer revokes/suspends from the dashboard or Managed tab → react-query lifecycle mutation (A4: now invalidates `getMyActivities` + `getActivityStats`).
2. Backend route (`boosts.ts`) writes the new `credStatus` on the credential relationship and (B1) emits a holder notification.
3. Issuer views auto-refresh (A4): activity list, stats (A3: incl. revoked/suspended counts), and the Managed-tab summary.
4. Holder wallet: lazy per-card verify (B2) re-checks status; the card reflects it via the B3 badge/pill/desaturation while staying in the Earned tab (B4).

### Testing strategy

**Backend (brain-service):**

-   A1: issuing a boost produces a VC2 credential with **both** `revocation` and `suspension` `BitstringStatusListEntry`s; suspending it then verifies as suspended (external verifiability).
-   A3: `getActivityStatsForProfile` returns correct `revoked`/`suspended` counts across mixed statuses.
-   A2: status is correct for a boost with >25 recipients (regression guard).
-   B1: revoke/suspend/unsuspend each emit the corresponding notification; a notification-queue failure does not fail the action.

**Frontend (learn-card-app):**

-   A4: revoke/suspend/unsuspend from dashboard **and** Managed tab refresh list + stats + `IssuancesSummary` with no manual callback; pagination + filters still work.
-   B3: card renders correct badge/pill/desaturation for `active | revoked | suspended`; badge/pill remain colored over the desaturated card.
-   B2: a card whose status check returns revoked shows the revoked treatment; a check error leaves it active (fail-open).

### Suggested build order

1. **A4** (react-query migration) + **A3** (stats) — self-contained backend/issuer; unblocks clean refresh.
2. **B3** + **B4** (holder visual) — highest user-visible value, FE-only.
3. **B2** (lazy detection) — feeds B3 with real status.
4. **B1** (notifications) — backend hook.
5. **A1** (default flip) — implement, heads-up to Taylor before merge.

## Out of scope

-   Detecting/observing revocations that happen on **external** status lists we don't control (only surfaced on-demand when the holder's wallet re-verifies, per B2).
-   Issuer-opt-in "notify recipient" toggle (B1 always notifies on internal actions).
-   Moving revoked/suspended creds out of the Earned tab, filter toggles, or re-sorting (B4 keeps them in place).

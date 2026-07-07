# Auth Status — canonical race-safe gating

This module is the **single source of truth** for "where is the user in the
auth/profile lifecycle?". Use it for every gating decision (onboarding prompts,
age gate, network-join prompts). It exists to make one bug class
**unrepresentable**: confusing _still resolving_ or _couldn't determine_ with
_genuinely has no profile_.

## Why

On app resume the persisted `currentUser` rehydrates instantly, so naive
`isLoggedIn` flips `true` **before** the private key / wallet is reconstructed.
Code that gated on `!data && !isLoading` then read a transient empty profile as
"no profile" and wrongly showed onboarding (Complete Profile, age gate,
JoinNetworkModal) to users who had already onboarded.

## The model

`deriveAuthStatus` is a **pure** function returning a discriminated union:

```ts
type AuthGateState =
    | { tag: 'unauthenticated' }
    | { tag: 'resolving' } // key/wallet rebuilding — NEVER gate
    | { tag: 'recovering' } // recovery/migration overlays own the UX
    | { tag: 'needs_setup' } // brand-new user (coordinator-driven onboarding)
    | {
          tag: 'ready';
          profile:
              | { tag: 'loading' } // wallet ready, profile in flight
              | { tag: 'error' } // couldn't determine — NEVER "no profile"
              | { tag: 'absent' } // CONFIRMED no profile — the ONLY onboarding state
              | { tag: 'present' };
      };
```

The onboarding gate requires a positive assertion — you cannot reach it from
`!data`:

```ts
const status = useAuthStatus();
if (shouldPromptProfileOnboarding(status)) {
    /* prompt */
}
```

## Rules

-   **Gate on `useAuthStatus()` + predicates** (`shouldPromptProfileOnboarding`,
    `hasNetworkProfile`, `isProfileResolved`, `isAuthResolving`).
-   **Do not** gate prompts on raw `useIsLoggedIn` — an ESLint rule warns about this
    in `components/network-prompts/**`.
-   `useIsCurrentUserLCNUser` is re-rooted on this selector, so its `data` /
    `isLoading` are already race-safe.

## Tests

-   `authStatus.test.ts` — exhaustive over the full input cross-product; proves the
    onboarding invariant holds in exactly one cell.
-   `useAuthGateState.test.tsx` — deterministic resume-race wiring tests.

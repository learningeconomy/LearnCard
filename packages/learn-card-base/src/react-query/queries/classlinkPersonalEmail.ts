import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClassLinkAccountContinuity, LCAPluginMethods } from '@learncard/lca-api-plugin';
import { walletStore } from '../../stores/walletStore';

/**
 * Personal-email status for a ClassLink sign-in. Each fetch is a DID-authenticated
 * lca-api call, so callers must pass `enabled: false` unless the tenant flag
 * (`features.classlinkPersonalEmail`) and session checks allow the prompt.
 */
export const useClassLinkPersonalEmail = (options: { enabled?: boolean } = {}) => {
    const learnCard = walletStore.use.wallet();
    const enabled = options.enabled ?? true;
    return useQuery({
        queryKey: ['classlinkPersonalEmail', learnCard?.id.did()],
        queryFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkGetPersonalEmail();
        },
        enabled: enabled && !!learnCard,
        retry: false,
    });
};

/** The lca-api methods `loadAccountContinuity` uses (a LearnCard's `invoke`). */
type ContinuityInvoke = Pick<
    LCAPluginMethods,
    'classlinkGetAccountContinuity' | 'classlinkReconcilePersonalEmail'
>;

/**
 * Signs this device back in with the custom token a reconcile returned (the app passes
 * `refreshAccountContact`, which checks the token's uid against the session first and keeps
 * an unapplied token for a retry).
 */
export type ApplySignInToken = (params: {
    customToken: string;
    primaryUid?: string;
}) => Promise<unknown>;

/** A reconcile is tried at most once per account in this window, whatever its outcome. */
export const RECONCILE_RETRY_MS = 60_000;

const reconcileTriedAt = new Map<string, number>();

/** Test helper: forget which accounts tried a reconcile. */
export const resetAccountContinuityReconcile = (): void => reconcileTriedAt.clear();

/**
 * Read `getAccountContinuity`; when it reports `reconcilePending` (an interrupted or
 * deferred sign-in email change), run `classlinkReconcilePersonalEmail` once, apply its
 * custom token (before any other call), then read continuity again. Never loops: one
 * reconcile per load, and at most one per account (`did`) every `RECONCILE_RETRY_MS`, so a
 * reconcile that keeps failing (or a server that keeps reporting it) is not retried on
 * every refetch. A failed reconcile is not an error: the first answer is returned as is.
 */
export const loadAccountContinuity = async (
    invoke: ContinuityInvoke,
    did: string,
    options: { applySignInToken?: ApplySignInToken; onReconciled?: () => void } = {}
): Promise<ClassLinkAccountContinuity> => {
    const first = await invoke.classlinkGetAccountContinuity();
    if (!first.reconcilePending) return first;
    const triedAt = reconcileTriedAt.get(did);
    if (triedAt !== undefined && Date.now() - triedAt < RECONCILE_RETRY_MS) return first;
    reconcileTriedAt.set(did, Date.now());
    let result: Awaited<ReturnType<ContinuityInvoke['classlinkReconcilePersonalEmail']>>;
    try {
        result = await invoke.classlinkReconcilePersonalEmail();
    } catch {
        return first;
    }
    if (result.customToken && options.applySignInToken) {
        try {
            await options.applySignInToken({
                customToken: result.customToken,
                ...(first.primaryUid ? { primaryUid: first.primaryUid } : {}),
            });
        } catch {
            // The coordinator keeps an unapplied token; the keep-account step offers a retry.
        }
    }
    if (!result.changed) return first;
    options.onReconciled?.();
    return invoke.classlinkGetAccountContinuity();
};

/**
 * What a ClassLink account still needs to keep working after losing school access
 * (`classlink.getAccountContinuity`): whether this account may add a personal email (and a
 * stable reason when not), and the next step. FORBIDDEN or NOT_FOUND means the account has
 * no ClassLink identity. Same cost rule as `useClassLinkPersonalEmail`: pass `enabled: false`
 * until the tenant flags and session checks allow it.
 *
 * When the server reports `reconcilePending`, the load undoes that sign-in email change
 * (`loadAccountContinuity`); pass `applySignInToken` (`refreshAccountContact`) so a custom
 * token it returns signs this device back in. Every caller should pass it: whichever
 * mounted caller starts a fetch runs it.
 */
export const useClassLinkAccountContinuity = (
    options: { enabled?: boolean; applySignInToken?: ApplySignInToken } = {}
) => {
    const learnCard = walletStore.use.wallet();
    const queryClient = useQueryClient();
    const enabled = options.enabled ?? true;
    const did = learnCard?.id.did();
    return useQuery({
        queryKey: ['classlinkAccountContinuity', did],
        queryFn: async () => {
            if (!learnCard || !did) throw new Error('Account is not ready');
            return loadAccountContinuity(learnCard.invoke, did, {
                applySignInToken: options.applySignInToken,
                onReconciled: () => {
                    void queryClient.invalidateQueries({
                        queryKey: ['classlinkPersonalEmail', did],
                    });
                },
            });
        },
        enabled: enabled && !!learnCard,
        retry: false,
    });
};

export const useStartPersonalEmail = () => {
    const learnCard = walletStore.use.wallet();
    return useMutation({
        mutationFn: async (input: { email: string }) => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkStartPersonalEmail(input);
        },
    });
};

export const useVerifyPersonalEmail = () => {
    const learnCard = walletStore.use.wallet();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { email: string; code: string }) => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkVerifyPersonalEmail(input);
        },
        onSuccess: (result, input) => {
            if (result.success) {
                const did = learnCard?.id.did();
                queryClient.setQueryData(['classlinkPersonalEmail', did], {
                    email: input.email,
                    verified: true,
                });
                // The address is now the sign-in email, which moves the next step.
                void queryClient.invalidateQueries({
                    queryKey: ['classlinkAccountContinuity', did],
                });
            }
        },
    });
};

/**
 * Remove the personal sign-in email: lca-api restores the previous sign-in email and contact
 * and returns a custom token for the login it signed out (see `KeepAccountStep`).
 */
export const useRemovePersonalEmail = () => {
    const learnCard = walletStore.use.wallet();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkRemovePersonalEmail();
        },
        onSettled: () => {
            const did = learnCard?.id.did();
            void queryClient.invalidateQueries({ queryKey: ['classlinkPersonalEmail', did] });
            void queryClient.invalidateQueries({ queryKey: ['classlinkAccountContinuity', did] });
        },
    });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/**
 * What a ClassLink account still needs to keep working after losing school access
 * (`classlink.getAccountContinuity`): whether this account may add a personal email (and a
 * stable reason when not), and the next step. FORBIDDEN or NOT_FOUND means the account has
 * no ClassLink identity. Same cost rule as `useClassLinkPersonalEmail`: pass `enabled: false`
 * until the tenant flags and session checks allow it.
 */
export const useClassLinkAccountContinuity = (options: { enabled?: boolean } = {}) => {
    const learnCard = walletStore.use.wallet();
    const enabled = options.enabled ?? true;
    return useQuery({
        queryKey: ['classlinkAccountContinuity', learnCard?.id.did()],
        queryFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkGetAccountContinuity();
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
                // Verifying can also set the recovery email, which moves the next step.
                void queryClient.invalidateQueries({
                    queryKey: ['classlinkAccountContinuity', did],
                });
            }
        },
    });
};

/** Remove the personal email (its sign-in link, a matching recovery email and the record). */
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

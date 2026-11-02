import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletStore } from '../../stores/walletStore';

export const useClassLinkPersonalEmail = () => {
    const learnCard = walletStore.use.wallet();
    return useQuery({
        queryKey: ['classlinkPersonalEmail', learnCard?.id.did()],
        queryFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkGetPersonalEmail();
        },
        enabled: !!learnCard,
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
                queryClient.setQueryData(['classlinkPersonalEmail', learnCard?.id.did()], {
                    email: input.email,
                    verified: true,
                });
            }
        },
    });
};

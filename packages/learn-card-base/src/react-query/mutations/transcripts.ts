import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletStore } from '../../stores/walletStore';

export const useRequestTranscript = () => {
    const learnCard = walletStore.use.wallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.transcriptsRequest({ consent: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transcriptStatus', learnCard?.id.did()] });
        },
    });
};

import { useQuery } from '@tanstack/react-query';
import { walletStore } from '../../stores/walletStore';

export const useTranscriptStatus = (enabled: boolean = true) => {
    const learnCard = walletStore.use.wallet();

    return useQuery({
        queryKey: ['transcriptStatus', learnCard?.id.did()],
        queryFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.transcriptsGetStatus();
        },
        enabled: enabled && !!learnCard,
        retry: false,
    });
};

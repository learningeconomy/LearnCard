import { useQuery } from '@tanstack/react-query';
import { walletStore } from '../../stores/walletStore';

export const SCHOOL_CONNECTION_QUERY_KEY = 'schoolConnection';

export const useSchoolConnection = (enabled: boolean = true) => {
    const learnCard = walletStore.use.wallet();

    return useQuery({
        queryKey: [SCHOOL_CONNECTION_QUERY_KEY, learnCard?.id.did()],
        queryFn: async () => {
            if (!learnCard) throw new Error('Account is not ready');
            return learnCard.invoke.classlinkGetConnection();
        },
        enabled: enabled && !!learnCard,
        retry: false,
    });
};

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

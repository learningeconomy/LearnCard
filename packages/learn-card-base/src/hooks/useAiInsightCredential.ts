import { VCValidator, VC } from '@learncard/types';
import { useQuery, useQueryClient, useMutation, QueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useWallet, LEARNCARD_AI_URL } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';

const queryKey = ['useAiInsightCredential'];

export const createAiInsightCredential = async (wallet: BespokeLearnCard) => {
    const did = wallet.id.did();
    const aiInsightCredential = await fetch(
        `${LEARNCARD_AI_URL}/credentials/ai-insight?did=${did}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    ).then(res =>
        res.json().then(data => {
            return data.credential;
        })
    );

    if (!aiInsightCredential) throw new Error('Failed to create AI Insight credential.');

    const parsedCredential = await VCValidator.parseAsync(aiInsightCredential);

    const uri = await wallet.store.LearnCloud.upload(parsedCredential);

    if (!uri) throw new Error('Failed to store AI Insight credential.');

    const existingRecord = await wallet.index.LearnCloud.get({ id: '__ai_insight__' });

    if (existingRecord?.length > 0) {
        await wallet.index.LearnCloud.update(existingRecord[0].id, { uri });
    } else {
        await wallet.index.LearnCloud.add<LCR>({
            uri,
            id: '__ai_insight__',
            category: 'AI Insight',
        });
    }

    return parsedCredential;
};

export const getOrCreateAiInsightCredential = async (
    wallet: BespokeLearnCard,
    queryClient: QueryClient,
    skipCache = false
): Promise<VC> => {
    if (!skipCache) {
        const cachedCredential = queryClient.getQueryData<VC>(queryKey);

        if (cachedCredential) return cachedCredential;
    }

    const record = await wallet.index.LearnCloud.get({ id: '__ai_insight__' });

    if (record?.length > 0) {
        const aiInsightCredential = await wallet.read.get(record[0].uri);

        if (!aiInsightCredential) throw new Error('Failed to get AI Insight credential.');

        return VCValidator.parseAsync(aiInsightCredential);
    }

    const aiInsightCredential = await createAiInsightCredential(wallet);

    if (!skipCache) queryClient.setQueryData(queryKey, aiInsightCredential);

    return aiInsightCredential;
};

export const useAiInsightCredential = () => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useAiInsightCredential'],
        queryFn: async () => getOrCreateAiInsightCredential(await initWallet(), queryClient, true),
        staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    });
};

export const useAiInsightCredentialMutation = () => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async () => createAiInsightCredential(await initWallet()),
        onSuccess: aiInsightCredential => {
            queryClient.setQueryData(queryKey, aiInsightCredential);
        },
    });
};

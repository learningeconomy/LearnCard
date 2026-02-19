import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useWallet, LEARNCARD_AI_URL } from 'learn-card-base';

import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import { LCR } from 'learn-card-base/types/credential-records';
import { VCValidator, VC } from '@learncard/types';

// Types for pathway data
interface PathwayStep {
    title?: string;
    description?: string;
    skills?: string[];
    keywords?: Record<string, string>;
}

interface PathwayItem {
    title?: string;
    description?: string;
    skills?: string[];
    pathwayUri?: string;
    topicUri?: string;
    keywords?: Record<string, string>;
}

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

export const useAiPathways = () => {
    const { data: aiInsightCredential } = useAiInsightCredential();
    const { initWallet, resolveCredential } = useWallet();

    return useQuery({
        queryKey: ['useAiPathways', aiInsightCredential?.insights?.suggestedPathways],
        queryFn: async () => {
            if (!aiInsightCredential?.insights?.suggestedPathways?.length) return [];

            const wallet = await initWallet();
            const creds = await Promise.all(
                aiInsightCredential.insights.suggestedPathways.map(async (uri: string) => {
                    try {
                        return await resolveCredential(uri);
                    } catch (e) {
                        console.warn('Failed to resolve pathway credential:', uri, e);
                        return undefined;
                    }
                })
            );

            const items = await Promise.all(
                creds.filter(Boolean).map(async cred => {
                    const vc: any = unwrapBoostCredential(cred as any);
                    const pathwayBoostUri: string | undefined = (cred as any)?.boostId;

                    // Try to find the parent topic via familial lookup
                    let topicUri: string | undefined;
                    if (pathwayBoostUri) {
                        try {
                            const family = await wallet.invoke.getFamilialBoosts(pathwayBoostUri, {
                                parentGenerations: 3,
                                childGenerations: 0,
                                limit: 100,
                            });
                            const topic = family?.records?.find(
                                (r: any) =>
                                    r?.category ===
                                    categoryMetadata[CredentialCategoryEnum.aiTopic]
                                        .contractCredentialTypeOverride
                            );
                            topicUri = topic?.uri;
                        } catch (e) {
                            console.warn('Failed to fetch familial boosts for pathway', e);
                        }
                    }

                    const lp = vc?.learningPathway;
                    const step: PathwayStep = lp?.step ?? lp ?? {};
                    const item: PathwayItem = {
                        title: step?.title,
                        description: step?.description,
                        skills: step?.skills ?? [],
                        pathwayUri: pathwayBoostUri,
                        topicUri,
                        keywords: step?.keywords ?? {},
                    };

                    return item;
                })
            );

            return items.filter(item => !!(item.title || item.description));
        },
        staleTime: 1000 * 60 * 60 * 24, // 1 day
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

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useWallet } from 'learn-card-base';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import {
    aiInsightRefreshStore,
    clearAiInsightRefreshState,
} from 'learn-card-base/stores/aiInsightRefreshStore';

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
const AI_INSIGHT_REFRESH_POLL_INTERVAL_MS = 5000; // 5 seconds
const AI_INSIGHT_REFRESH_MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes

const logAiInsightCredential = (message: string, data?: Record<string, unknown>) => {
    try {
        if (data) {
            console.log(`[AiInsightCredential] ${message}`, data);
        } else {
            console.log(`[AiInsightCredential] ${message}`);
        }
    } catch {
        // logging should never break credential creation
    }
};

const logAiInsightCredentialError = (
    message: string,
    err: unknown,
    data?: Record<string, unknown>
) => {
    try {
        console.error(`[AiInsightCredential] ${message}`, data ?? {}, err);
    } catch {
        // logging should never break credential creation
    }
};

export const createAiInsightCredential = async (wallet: BespokeLearnCard) => {
    const did = wallet.id.did();

    logAiInsightCredential('Requesting AI insight credential', {
        did,
        aiServiceUrl: networkStore.get.aiServiceUrl(),
    });

    const response = await fetch(
        `${networkStore.get.aiServiceUrl()}/credentials/ai-insight?did=${did}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );

    const responseText = await response.text();

    if (!response.ok) {
        logAiInsightCredentialError(
            'AI insight credential request failed',
            new Error(responseText),
            {
                did,
                status: response.status,
                statusText: response.statusText,
                responseText,
            }
        );
        throw new Error(
            `Failed to create AI Insight credential (${response.status} ${response.statusText})`
        );
    }

    let aiInsightCredential: unknown;
    try {
        aiInsightCredential = JSON.parse(responseText)?.credential;
    } catch (err) {
        logAiInsightCredentialError('Failed to parse AI insight credential response', err, {
            did,
            responseText,
        });
        throw new Error('Failed to create AI Insight credential.');
    }

    if (!aiInsightCredential) throw new Error('Failed to create AI Insight credential.');

    const parsedCredential = await VCValidator.parseAsync(aiInsightCredential);

    logAiInsightCredential('Received AI insight credential', {
        did,
        credentialId: parsedCredential.id,
        issuanceDate: parsedCredential.issuanceDate,
    });

    const uri = await wallet.store.LearnCloud.upload(parsedCredential);

    if (!uri) throw new Error('Failed to store AI Insight credential.');

    logAiInsightCredential('Stored AI insight credential', {
        did,
        credentialId: parsedCredential.id,
        uri,
    });

    const existingRecord = await wallet.index.LearnCloud.get({ id: '__ai_insight__' });

    if (existingRecord?.length > 0) {
        await wallet.index.LearnCloud.update(existingRecord[0].id, { uri });
        logAiInsightCredential('Updated AI insight index record', {
            did,
            recordId: existingRecord[0].id,
            uri,
        });
    } else {
        await wallet.index.LearnCloud.add<LCR>({
            uri,
            id: '__ai_insight__',
            category: 'AI Insight',
        });
        logAiInsightCredential('Created AI insight index record', {
            did,
            uri,
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
    const refreshStatus = aiInsightRefreshStore.use.status();
    const requestedAt = aiInsightRefreshStore.use.requestedAt();
    const baselineCredentialId = aiInsightRefreshStore.use.baselineCredentialId();

    logAiInsightCredential('Hook state', {
        refreshStatus,
        requestedAt,
        baselineCredentialId,
    });

    const query = useQuery({
        queryKey: ['useAiInsightCredential'],
        queryFn: async () => {
            const wallet = await initWallet();

            logAiInsightCredential('Query fetch start', {
                walletDid: wallet.id.did(),
                refreshStatus,
                requestedAt,
                baselineCredentialId,
            });

            if (refreshStatus === 'pending') {
                logAiInsightCredential(
                    'Pending refresh detected; requesting fresh credential from backend',
                    {
                        walletDid: wallet.id.did(),
                        requestedAt,
                        baselineCredentialId,
                    }
                );

                const credential = await createAiInsightCredential(wallet);

                logAiInsightCredential('Query fetch complete via refresh path', {
                    credentialId: credential.id,
                    issuanceDate: credential.issuanceDate,
                    requestedAt,
                });

                return credential;
            }

            const credential = await getOrCreateAiInsightCredential(wallet, queryClient, true);

            logAiInsightCredential('Query fetch complete', {
                credentialId: credential.id,
                issuanceDate: credential.issuanceDate,
            });

            return credential;
        },
        staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
        refetchInterval: refreshStatus === 'pending' ? AI_INSIGHT_REFRESH_POLL_INTERVAL_MS : false,
    });

    useEffect(() => {
        if (refreshStatus !== 'pending' || !requestedAt) return;

        logAiInsightCredential('Refresh timeout scheduled', {
            requestedAt,
            timeoutMs: AI_INSIGHT_REFRESH_MAX_WAIT_MS,
        });

        const timeoutId = setTimeout(() => {
            const currentStatus = aiInsightRefreshStore.get.status();
            const currentRequestedAt = aiInsightRefreshStore.get.requestedAt();

            logAiInsightCredential('Refresh timeout fired', {
                requestedAt,
                currentStatus,
                currentRequestedAt,
            });

            if (currentStatus === 'pending' && currentRequestedAt === requestedAt) {
                logAiInsightCredential('Refresh timed out; clearing stale pending state', {
                    requestedAt,
                });
                clearAiInsightRefreshState();
            }
        }, AI_INSIGHT_REFRESH_MAX_WAIT_MS);

        return () => clearTimeout(timeoutId);
    }, [refreshStatus, requestedAt]);

    useEffect(() => {
        if (refreshStatus !== 'pending' || !query.data || !requestedAt) return;

        const issuanceDateMs = query.data.issuanceDate
            ? new Date(query.data.issuanceDate).getTime()
            : NaN;
        const hasNewCredential =
            (Number.isFinite(issuanceDateMs) && issuanceDateMs >= requestedAt) ||
            (baselineCredentialId ? query.data.id !== baselineCredentialId : false);

        logAiInsightCredential('Refresh evaluation', {
            requestedAt,
            baselineCredentialId,
            credentialId: query.data.id,
            issuanceDate: query.data.issuanceDate,
            issuanceDateMs,
            hasNewCredential,
            refreshStatus,
        });

        if (hasNewCredential) {
            logAiInsightCredential('New AI insight credential detected; clearing refresh state', {
                credentialId: query.data.id,
                issuanceDate: query.data.issuanceDate,
            });
            clearAiInsightRefreshState();
            queryClient.invalidateQueries({ queryKey: ['useAiPathways'] });
            queryClient.invalidateQueries({ queryKey: ['training-programs'] });
        } else {
            logAiInsightCredential('AI insight credential not yet updated', {
                credentialId: query.data.id,
                issuanceDate: query.data.issuanceDate,
                requestedAt,
                baselineCredentialId,
            });
        }
    }, [
        baselineCredentialId,
        query.data?.id,
        query.data?.issuanceDate,
        queryClient,
        refreshStatus,
        requestedAt,
    ]);

    return query;
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
            clearAiInsightRefreshState();
            queryClient.setQueryData(queryKey, aiInsightCredential);
            queryClient.invalidateQueries({ queryKey: ['useAiPathways'] });
            queryClient.invalidateQueries({ queryKey: ['training-programs'] });
        },
    });
};

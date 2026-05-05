import { UnsignedVC, VC } from '@learncard/types';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { UploadTypesEnum } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { networkStore } from '../../stores/NetworkStore';
import {
    setAiInsightRefreshError,
    setAiInsightRefreshPending,
} from '../../stores/aiInsightRefreshStore';

const aiInsightCredentialQueryKey = ['useAiInsightCredential'];
const AI_INSIGHT_REFRESH_DEBOUNCE_MS = 1000;
let aiPassportRefreshPromise: Promise<void> | null = null;

const logAiInsightRefresh = (message: string, data?: Record<string, unknown>) => {
    try {
        if (data) {
            console.log(`[AiInsightRefresh] ${message}`, data);
        } else {
            console.log(`[AiInsightRefresh] ${message}`);
        }
    } catch {
        // logging should never break refresh flow
    }
};

const logAiInsightRefreshError = (
    message: string,
    err: unknown,
    data?: Record<string, unknown>
) => {
    try {
        console.error(`[AiInsightRefresh] ${message}`, data ?? {}, err);
    } catch {
        // logging should never break refresh flow
    }
};

export const requestAiPassportCredentialRefresh = async (
    wallet: BespokeLearnCard
): Promise<void> => {
    const did = wallet.id.did();

    logAiInsightRefresh('Requesting backend refresh', {
        did,
        aiServiceUrl: networkStore.get.aiServiceUrl(),
    });

    const response = await fetch(`${networkStore.get.aiServiceUrl()}/credentials?did=${did}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        logAiInsightRefreshError(
            'Backend refresh request failed',
            new Error(`HTTP ${response.status} ${response.statusText}`),
            {
                did,
                status: response.status,
                statusText: response.statusText,
            }
        );
        throw new Error('Failed to request AI Insight credential refresh');
    }

    logAiInsightRefresh('Backend refresh request accepted', {
        did,
        status: response.status,
        statusText: response.statusText,
    });
};

export const queueAiInsightCredentialRefresh = async ({
    wallet,
    queryClient,
}: {
    wallet: BespokeLearnCard;
    queryClient: QueryClient;
}): Promise<void> => {
    if (aiPassportRefreshPromise) {
        logAiInsightRefresh('Refresh already queued; reusing promise');
        return aiPassportRefreshPromise;
    }

    const currentAiInsightCredential = queryClient.getQueryData<VC>(aiInsightCredentialQueryKey);

    logAiInsightRefresh('Queueing refresh', {
        walletDid: wallet.id.did(),
        currentCredentialId: currentAiInsightCredential?.id ?? null,
        currentCredentialIssuanceDate: currentAiInsightCredential?.issuanceDate ?? null,
        debounceMs: AI_INSIGHT_REFRESH_DEBOUNCE_MS,
    });

    setAiInsightRefreshPending({
        requestedAt: Date.now(),
        baselineCredentialId: currentAiInsightCredential?.id ?? null,
    });

    aiPassportRefreshPromise = (async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, AI_INSIGHT_REFRESH_DEBOUNCE_MS));
            await requestAiPassportCredentialRefresh(wallet);
            logAiInsightRefresh('Invalidating cached AI insight credential', {
                queryKey: aiInsightCredentialQueryKey,
            });
            await queryClient.invalidateQueries({ queryKey: aiInsightCredentialQueryKey });
            logAiInsightRefresh('Invalidated cached AI insight credential', {
                queryKey: aiInsightCredentialQueryKey,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setAiInsightRefreshError(message);
            logAiInsightRefreshError('Failed to request AI Insight credential refresh', error);
        }
    })().finally(() => {
        logAiInsightRefresh('Refresh promise cleared');
        aiPassportRefreshPromise = null;
    });

    return aiPassportRefreshPromise;
};

export const usePreloadAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ did, summaryCredential }: { did: string; summaryCredential: any }) => {
            const res = await fetch(`${networkStore.get.aiServiceUrl()}/assessment?did=${did}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summaryCredential }),
            });

            if (!res.ok) throw new Error('Failed to preload assessment');
            const assessment = await res.json();

            return { assessment, boostId: summaryCredential?.boostId };
        },
        onSuccess: ({ assessment, boostId }) => {
            queryClient.setQueryData(['assessment', boostId], assessment);
        },
        onError: error => {
            console.error('Failed to preload assessment:', error);
        },
    });
};

type FinishAssessmentPayload = {
    did: string;
    assessmentQA: any;
    session: any;
    sessionUri: string;
};

export const useFinishAssessmentMutation = () => {
    return useMutation({
        mutationFn: async ({ did, assessmentQA, session, sessionUri }: FinishAssessmentPayload) => {
            const response = await fetch(
                `${networkStore.get.aiServiceUrl()}/finish-assessment?did=${did}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assessmentQA, session, sessionUri }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to finish assessment');
            }

            return response.json();
        },
    });
};

export const useUploadFileMutation = (fileType: UploadTypesEnum) => {
    return useMutation({
        mutationFn: async ({
            did,
            file,
            fileType,
        }: {
            did: string;
            file: string;
            fileType: UploadTypesEnum;
        }) => {
            try {
                const response = await fetch(
                    `${networkStore.get.aiServiceUrl()}/credentials/parse-file?did=${did}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file, fileType }),
                    }
                );

                const responseJson: {
                    vcs: { vc: UnsignedVC; metadata: { name: string; category: string } }[];
                    error?: string;
                } = await response.json();

                if (!response.ok) {
                    throw new Error(responseJson?.error || 'Unknown server error');
                }

                return responseJson;
            } catch (error) {
                console.error('Failed to upload resume:', error);
                throw new Error(error as string);
            }
        },
    });
};

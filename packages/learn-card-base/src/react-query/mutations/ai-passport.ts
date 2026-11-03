import { VC } from '@learncard/types';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { UploadTypesEnum } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { createAiInsightCredential } from '../../hooks/useAiInsightCredential';
import { networkStore } from '../../stores/NetworkStore';
import {
    clearAiInsightRefreshState,
    setAiInsightRefreshError,
    setAiInsightRefreshPending,
} from '../../stores/aiInsightRefreshStore';
import { getLogger } from '../../logging/logger';
import { addActiveLocaleToUrl } from '../../i18n';
import { aiPassportFetch } from '../../helpers/aiPassportAuth';
import { AiServiceError, getAiServiceError } from '../../helpers/aiErrors';
import { extractFileCredentials } from '../../helpers/fileExtraction';
import type { FileExtractionAttempt } from '../../types/file-extraction';
const log = getLogger('ai-passport');

const aiInsightCredentialQueryKey = ['useAiInsightCredential'];
const AI_INSIGHT_REFRESH_DEBOUNCE_MS = 1000;
let aiPassportRefreshPromise: Promise<void> | null = null;
const ENABLE_AI_INSIGHT_REFRESH_LOGS = false;

const logAiInsightRefresh = (message: string, data?: Record<string, unknown>) => {
    if (!ENABLE_AI_INSIGHT_REFRESH_LOGS) return;

    try {
        if (data) {
            log.debug(`[AiInsightRefresh] ${message}`, data);
        } else {
            log.debug(`[AiInsightRefresh] ${message}`);
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
    if (!ENABLE_AI_INSIGHT_REFRESH_LOGS) return;

    try {
        log.error(`[AiInsightRefresh] ${message}`, data ?? {}, err);
    } catch {
        // logging should never break refresh flow
    }
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

    const baselineCredentialId = currentAiInsightCredential?.id ?? null;

    logAiInsightRefresh('Queueing refresh', {
        walletDid: wallet.id.did(),
        currentCredentialId: baselineCredentialId,
        currentCredentialIssuanceDate: currentAiInsightCredential?.issuanceDate ?? null,
        debounceMs: AI_INSIGHT_REFRESH_DEBOUNCE_MS,
    });

    setAiInsightRefreshPending({
        requestedAt: Date.now(),
        baselineCredentialId,
    });

    aiPassportRefreshPromise = (async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, AI_INSIGHT_REFRESH_DEBOUNCE_MS));
            const aiInsightCredential = await createAiInsightCredential(wallet);

            queryClient.setQueryData(aiInsightCredentialQueryKey, aiInsightCredential);
            queryClient.setQueryData(['useExistingAiInsightCredential'], aiInsightCredential);

            logAiInsightRefresh('Invalidating cached AI insight credential', {
                queryKey: aiInsightCredentialQueryKey,
            });
            await queryClient.invalidateQueries({ queryKey: aiInsightCredentialQueryKey });
            await queryClient.invalidateQueries({ queryKey: ['useExistingAiInsightCredential'] });
            await queryClient.invalidateQueries({ queryKey: ['useAiPathways'] });
            await queryClient.invalidateQueries({ queryKey: ['training-programs'] });
            logAiInsightRefresh('Invalidated cached AI insight credential', {
                queryKey: aiInsightCredentialQueryKey,
            });

            clearAiInsightRefreshState();
        } catch (error) {
            logAiInsightRefreshError('Failed to request AI Insight credential refresh', error);
            setAiInsightRefreshError(error instanceof Error ? error.message : String(error));
            throw error;
        } finally {
            logAiInsightRefresh('Refresh promise cleared');
            aiPassportRefreshPromise = null;
        }
    })();

    return aiPassportRefreshPromise;
};

export const usePreloadAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            did,
            summaryCredential,
            summaryCredentialUri,
        }: {
            did: string;
            summaryCredential: VC;
            summaryCredentialUri?: string;
        }) => {
            const attemptId = crypto.randomUUID();
            const startedAt = performance.now();
            let stage = 'request';
            let httpStatus: number | undefined;
            log.info('ai.assessment.preload.started', { attemptId });

            try {
                const res = await aiPassportFetch(
                    addActiveLocaleToUrl(`${networkStore.get.aiServiceUrl()}/assessment`),
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            summaryCredential,
                            summaryCredentialUri,
                            attemptId,
                        }),
                    },
                    did
                );
                stage = 'http_response';
                httpStatus = res.status;

                if (!res.ok) {
                    throw (
                        (await getAiServiceError(res)) ??
                        new Error(`Failed to preload assessment (HTTP ${res.status})`)
                    );
                }
                stage = 'response_parse';
                const assessment = await res.json();
                log.info('ai.assessment.preload.received', {
                    attemptId,
                    httpStatus,
                    durationMs: Math.round(performance.now() - startedAt),
                    questionCount: Array.isArray(assessment) ? assessment.length : 0,
                });

                return { assessment, boostId: summaryCredential?.boostId };
            } catch (error) {
                log.error('ai.assessment.preload.failed', {
                    attemptId,
                    stage,
                    httpStatus,
                    durationMs: Math.round(performance.now() - startedAt),
                    code: error instanceof AiServiceError ? error.payload.code : 'request_failed',
                });
                throw error;
            }
        },
        onSuccess: ({ assessment, boostId }) => {
            queryClient.setQueryData(['assessment', boostId], assessment);
        },
    });
};

type FinishAssessmentPayload = {
    did: string;
    assessmentQA: any;
    session: any;
    sessionUri: string;
    summaryCredentialUri?: string;
};

export const useFinishAssessmentMutation = () => {
    return useMutation({
        mutationFn: async ({
            did,
            assessmentQA,
            session,
            sessionUri,
            summaryCredentialUri,
        }: FinishAssessmentPayload) => {
            const response = await aiPassportFetch(
                addActiveLocaleToUrl(`${networkStore.get.aiServiceUrl()}/finish-assessment`),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assessmentQA,
                        session,
                        sessionUri,
                        summaryCredentialUri,
                    }),
                },
                did
            );

            if (!response.ok) {
                throw new Error('Failed to finish assessment');
            }

            return response.json();
        },
    });
};

export const useUploadFileMutation = () => {
    return useMutation({
        mutationFn: (input: {
            did: string;
            file: string;
            fileType: UploadTypesEnum;
            attempt?: FileExtractionAttempt;
            waitSignal?: AbortSignal;
            onWaiting?: (waiting: boolean) => void;
            onAttempt?: (attempt: FileExtractionAttempt) => void;
        }) => extractFileCredentials(input),
    });
};

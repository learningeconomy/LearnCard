import { useRef, useState } from 'react';
import { ConsentFlowTerms } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { getTermsWithSharedUrisForWallet } from './useSharedUrisInTerms';
import { loadContractAudience } from './consentAudience';
import { useConsentAudienceReview } from './useConsentAudienceReview';

export const useConsentToContract = (
    uri: string,
    _contractOwnerDid: string,
    recipientToken?: string // required for SmartResume and SmartResume only
) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const reviewAudience = useConsentAudienceReview();

    // Keep the exact accepted publication in memory until an explicit retry completes.
    const publication = useRef<
        | {
              uri: string;
              holderDid: string;
              recipientToken: string;
              submission: {
                  terms: ConsentFlowTerms;
                  expiresAt?: string;
                  oneTime?: boolean;
                  audienceVersion: number;
                  expectedRequestId?: string;
              };
          }
        | undefined
    >(undefined);
    const [retryContext, setRetryContext] = useState<{
        uri: string;
        recipientToken: string;
    } | null>(null);
    const clearPublicationRetry = () => {
        publication.current = undefined;
        setRetryContext(null);
    };
    const mutation = useMutation({
        mutationFn: async (_terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
            skipSharedUriMaterialization?: boolean;
            expectedRequestId?: string;
            /** Explicitly resend the retained SmartResume publication; never rematerialize it. */
            retryPreparedPublication?: boolean;
            /** Runs after credential preparation, immediately before submitting consent. */
            beforeSubmit?: () => Promise<void>;
        }) => {
            const wallet = await initWallet();
            const {
                beforeSubmit,
                skipSharedUriMaterialization,
                retryPreparedPublication,
                expectedRequestId,
                ...submission
            } = _terms;
            if (retryPreparedPublication) {
                const saved = publication.current;
                if (
                    !saved ||
                    saved.uri !== uri ||
                    saved.recipientToken !== recipientToken ||
                    saved.holderDid !== (await wallet.id.did())
                ) {
                    clearPublicationRetry();
                    throw new Error('The saved publication is unavailable for this account');
                }
                await beforeSubmit?.();
                // Approval can switch accounts; recheck the holder before resending.
                const currentWallet = await initWallet();
                if (saved.holderDid !== (await currentWallet.id.did())) {
                    clearPublicationRetry();
                    throw new Error('The publication account changed');
                }
                await beforeSubmit?.();
                try {
                    const result = await currentWallet.invoke.consentToContract(
                        uri,
                        structuredClone(saved.submission),
                        saved.recipientToken
                    );
                    clearPublicationRetry();
                    return result;
                } catch (error) {
                    // An ambiguous failure may have reached the server. Keep the exact
                    // accepted decision until success or a confirmed invalidation.
                    if (
                        error &&
                        typeof error === 'object' &&
                        'data' in error &&
                        error.data &&
                        typeof error.data === 'object' &&
                        'code' in error.data &&
                        ['CONFLICT', 'BAD_REQUEST', 'NOT_FOUND'].includes(String(error.data.code))
                    )
                        clearPublicationRetry();
                    throw error;
                }
            }
            clearPublicationRetry();

            const audience = await loadContractAudience(wallet, uri);
            await reviewAudience(audience.contract);
            const terms =
                skipSharedUriMaterialization &&
                Object.values(submission.terms.read.credentials.categories).every(
                    category => !category.shared?.length
                )
                    ? {
                          terms: submission.terms,
                          expiresAt: submission.expiresAt,
                          oneTime: submission.oneTime,
                      }
                    : await getTermsWithSharedUrisForWallet(
                          wallet,
                          audience.recipients,
                          queryClient,
                          submission
                      );

            const prepared = structuredClone({
                ...terms,
                audienceVersion: audience.audienceVersion,
                expectedRequestId,
            });
            const holderDid = recipientToken ? await wallet.id.did() : undefined;
            await beforeSubmit?.();
            try {
                return await wallet.invoke.consentToContract(
                    uri,
                    structuredClone(prepared),
                    recipientToken
                );
            } catch (error) {
                if (
                    recipientToken &&
                    holderDid &&
                    error &&
                    typeof error === 'object' &&
                    'data' in error &&
                    error.data &&
                    typeof error.data === 'object' &&
                    'code' in error.data &&
                    error.data.code === 'BAD_GATEWAY'
                ) {
                    publication.current = { uri, holderDid, recipientToken, submission: prepared };
                    setRetryContext({ uri, recipientToken });
                }
                throw error;
            }
        },
        onSuccess: data => {
            if (data) {
                const switchedDid = switchedProfileStore.get.switchedDid();
                return queryClient.invalidateQueries({
                    queryKey: ['useConsentedContracts', switchedDid ?? ''],
                });
            }
        },
    });
    return {
        ...mutation,
        publicationRetryAvailable:
            retryContext?.uri === uri && retryContext?.recipientToken === recipientToken,
        retrySmartResumePublication: (beforeSubmit?: () => Promise<void>) => {
            if (!publication.current) return Promise.reject(new Error('No publication to retry'));
            return mutation.mutateAsync({
                terms: publication.current.submission.terms,
                retryPreparedPublication: true,
                beforeSubmit,
            });
        },
    };
};

export const useSendAiInsightsContractRequest = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            contractUri,
            targetProfileId,
            shareLink,
        }: {
            contractUri: string;
            targetProfileId: string;
            shareLink: string;
        }) => {
            const wallet = await initWallet();
            return wallet.invoke.sendAiInsightsContractRequest(
                contractUri,
                targetProfileId,
                shareLink
            );
        },
        onSuccess: data => {
            if (data) {
            }
        },
    });
};

export const useSendAiInsightsShareRequest = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            targetProfileId,
            shareLink,
            childProfileId,
        }: {
            targetProfileId: string;
            shareLink: string;
            childProfileId?: string;
        }) => {
            const wallet = await initWallet();
            return wallet.invoke.sendAiInsightShareRequest(
                targetProfileId,
                shareLink,
                childProfileId
            );
        },
        onSuccess: data => {
            if (data) {
            }
        },
    });
};

export const useMarkContractRequestAsSeen = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            contractUri,
            targetProfileId,
        }: {
            contractUri: string;
            targetProfileId: string;
        }) => {
            const wallet = await initWallet();
            return wallet.invoke.markContractRequestAsSeen(contractUri, targetProfileId);
        },
    });
};

export const useCancelContractRequest = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            contractUri,
            targetProfileId,
        }: {
            contractUri: string;
            targetProfileId: string;
        }) => {
            const wallet = await initWallet();
            return wallet.invoke.cancelContractRequest(contractUri, targetProfileId);
        },
    });
};

export const useForwardContractRequestToProfile = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            parentProfileId,
            targetProfileId,
            contractUri,
        }: {
            parentProfileId: string;
            targetProfileId: string;
            contractUri?: string;
        }) => {
            const wallet = await initWallet();
            return wallet.invoke.forwardContractRequestToProfile(
                parentProfileId,
                targetProfileId,
                contractUri
            );
        },
    });
};

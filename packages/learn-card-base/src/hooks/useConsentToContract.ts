import { ConsentFlowTerms } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { useSharedUrisInTerms } from './useSharedUrisInTerms';

export const useConsentToContract = (
    uri: string,
    contractOwnerDid: string,
    recipientToken?: string // required for SmartResume and SmartResume only
) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const { getTermsWithSharedUris } = useSharedUrisInTerms(contractOwnerDid);

    return useMutation({
        mutationFn: async (_terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        }) => {
            const wallet = await initWallet();

            const terms = await getTermsWithSharedUris(_terms);

            return wallet.invoke.consentToContract(uri, terms, recipientToken);
        },
        onSuccess: data => {
            if (data) {
                const switchedDid = switchedProfileStore.get.switchedDid();
                queryClient.refetchQueries({
                    queryKey: ['useConsentedContracts', switchedDid ?? ''],
                });
            }
        },
    });
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

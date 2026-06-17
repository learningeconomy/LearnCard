import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-auto-consent-learn-card-ai');

import { CurrentUser, useWallet, useCurrentUser, useWithdrawConsent } from 'learn-card-base';
import { getOrFetchConsentedContracts } from 'learn-card-base';
import { getTermsWithSharedUrisForWallet } from 'learn-card-base';

import {
    AiPassportAppsEnum,
    aiPassportApps,
} from '../components/ai-passport-apps/aiPassport-apps.helpers';
import {
    getAllCredentialUrisForCategory,
    getFullTermsForContract,
} from '../helpers/contract.helpers';

let autoConsentInFlight: Promise<boolean> | null = null;
let withdrawConsentInFlight: Promise<boolean> | null = null;

type AutoConsentOptions = {
    enabled: boolean;
    userOverrides?: Partial<CurrentUser>;
};

const getLearnCardAiContractUri = (): string | undefined =>
    aiPassportApps.find(app => app.type === AiPassportAppsEnum.learncardapp)?.contractUri;

export const useAutoConsentLearnCardAi = () => {
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const { mutateAsync: withdrawConsent } = useWithdrawConsent(getLearnCardAiContractUri() ?? '');
    const learnCardAiContractUri = getLearnCardAiContractUri();

    const autoConsentLearnCardAi = useCallback(
        async ({ enabled, userOverrides }: AutoConsentOptions) => {
            if (!enabled) return false;
            if (autoConsentInFlight) return autoConsentInFlight;

            const run = (async () => {
                let wallet: Awaited<ReturnType<typeof initWallet>> | null = null;
                let activeWallet: Awaited<ReturnType<typeof initWallet>> | null = null;

                try {
                    wallet = await initWallet();
                    if (!wallet) return false;
                    activeWallet = wallet;
                    const consentWallet = activeWallet;
                    if (!consentWallet) return false;

                    if (!learnCardAiContractUri) return false;

                    const consentedContracts = await getOrFetchConsentedContracts(
                        queryClient,
                        consentWallet
                    );
                    const alreadyConsented = consentedContracts.some(
                        (consent: { contract?: { uri?: string }; status?: string | null }) =>
                            consent?.contract?.uri === learnCardAiContractUri &&
                            consent?.status !== 'withdrawn'
                    );

                    if (alreadyConsented) return true;

                    const contractDetails = await consentWallet.invoke.getContract(
                        learnCardAiContractUri
                    );
                    const ownerDid = contractDetails?.owner?.did;
                    if (!contractDetails?.contract || !ownerDid) return false;

                    const consentUser: CurrentUser = {
                        uid: '',
                        email: '',
                        phoneNumber: '',
                        name: '',
                        profileImage: '',
                        privateKey: null,
                        baseColor: '',
                        ...(currentUser ?? {}),
                        ...(userOverrides ?? {}),
                    };
                    const terms = getFullTermsForContract(contractDetails.contract, consentUser);

                    const categoriesWithLiveSync = Object.keys(terms.read.credentials.categories);
                    for (const category of categoriesWithLiveSync) {
                        terms.read.credentials.categories[category].shared =
                            await getAllCredentialUrisForCategory(consentWallet, category);
                    }

                    log.debug('Prepared LearnCard AI auto-consent categories', {
                        categoryCount: categoriesWithLiveSync.length,
                        totalCredentialUris: categoriesWithLiveSync.reduce(
                            (count, category) =>
                                count +
                                (terms.read.credentials.categories[category].shared?.length ?? 0),
                            0
                        ),
                        categoryCounts: Object.fromEntries(
                            categoriesWithLiveSync.map(category => [
                                category,
                                terms.read.credentials.categories[category].shared?.length ?? 0,
                            ])
                        ),
                    });

                    const enrichedTerms = await getTermsWithSharedUrisForWallet(
                        consentWallet,
                        ownerDid,
                        queryClient,
                        {
                            terms,
                            expiresAt: '',
                            oneTime: false,
                        }
                    );

                    await consentWallet.invoke.consentToContract(learnCardAiContractUri, {
                        terms: enrichedTerms.terms,
                        expiresAt: '',
                        oneTime: false,
                    });

                    await queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] });

                    return true;
                } catch (error) {
                    try {
                        await queryClient.invalidateQueries({
                            queryKey: ['useConsentedContracts'],
                        });

                        const recoveryWallet = activeWallet;
                        if (!recoveryWallet) throw error;

                        const refreshedConsents = await getOrFetchConsentedContracts(
                            queryClient,
                            recoveryWallet
                        );
                        const recoveredConsent = refreshedConsents.some(
                            (consent: { contract?: { uri?: string }; status?: string | null }) =>
                                consent?.contract?.uri === learnCardAiContractUri &&
                                consent?.status !== 'withdrawn'
                        );

                        if (recoveredConsent) {
                            return true;
                        }
                    } catch {
                        // fall through to the original error handling below
                    }

                    log.error('Failed to auto-consent to LearnCard AI contract:', error);
                    return false;
                } finally {
                    autoConsentInFlight = null;
                }
            })();

            autoConsentInFlight = run;
            return run;
        },
        [currentUser, initWallet, learnCardAiContractUri, queryClient]
    );

    const withdrawLearnCardAiConsent = useCallback(async () => {
        if (withdrawConsentInFlight) return withdrawConsentInFlight;

        const run = (async () => {
            try {
                const wallet = await initWallet();
                if (!wallet) return false;
                if (!learnCardAiContractUri) return false;

                const consentedContracts = await getOrFetchConsentedContracts(queryClient, wallet);
                const consentedContract = consentedContracts.find(
                    (consent: {
                        uri?: string;
                        contract?: { uri?: string };
                        status?: string | null;
                    }) =>
                        consent?.contract?.uri === learnCardAiContractUri &&
                        consent?.status !== 'withdrawn'
                );

                if (!consentedContract?.uri) return true;

                await withdrawConsent(consentedContract.uri);
                return true;
            } catch (error) {
                log.error('Failed to withdraw LearnCard AI consent:', error);
                return false;
            } finally {
                withdrawConsentInFlight = null;
            }
        })();

        withdrawConsentInFlight = run;
        return run;
    }, [initWallet, learnCardAiContractUri, queryClient, withdrawConsent]);

    return { autoConsentLearnCardAi, withdrawLearnCardAiConsent };
};

export default useAutoConsentLearnCardAi;

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { CurrentUser, useWallet, useCurrentUser } from 'learn-card-base';
import { getOrFetchConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { getTermsWithSharedUrisForWallet } from 'learn-card-base/hooks/useSharedUrisInTerms';

import {
    AiPassportAppsEnum,
    aiPassportApps,
} from '../components/ai-passport-apps/aiPassport-apps.helpers';
import { getFullTermsForContract } from '../helpers/contract.helpers';

type AutoConsentOptions = {
    enabled: boolean;
    userOverrides?: Partial<CurrentUser>;
};

export const useAutoConsentLearnCardAi = () => {
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const inFlightRef = useRef<Promise<boolean> | null>(null);

    const autoConsentLearnCardAi = useCallback(
        async ({ enabled, userOverrides }: AutoConsentOptions) => {
            if (!enabled) return false;
            if (inFlightRef.current) return inFlightRef.current;

            const run = (async () => {
                try {
                    const wallet = await initWallet();
                    if (!wallet) return false;

                    const learnCardAiApp = aiPassportApps.find(
                        app => app.type === AiPassportAppsEnum.learncardapp
                    );
                    const contractUri = learnCardAiApp?.contractUri;
                    if (!contractUri) return false;

                    const consentedContracts = await getOrFetchConsentedContracts(
                        queryClient,
                        wallet
                    );
                    const alreadyConsented = consentedContracts.some(
                        (consent: { contract?: { uri?: string }; status?: string | null }) =>
                            consent?.contract?.uri === contractUri &&
                            consent?.status !== 'withdrawn'
                    );

                    if (alreadyConsented) return true;

                    const contractDetails = await wallet.invoke.getContract(contractUri);
                    const ownerDid = contractDetails?.owner?.did;
                    if (!contractDetails?.contract || !ownerDid) return false;

                    const consentUser: CurrentUser = {
                        ...(currentUser ?? {}),
                        ...(userOverrides ?? {}),
                    };
                    const terms = getFullTermsForContract(contractDetails.contract, consentUser);

                    const categoriesWithLiveSync = Object.keys(terms.read.credentials.categories);
                    await Promise.all(
                        categoriesWithLiveSync.map(async (category: string) => {
                            const allCategoryCredUris =
                                (await wallet.index.LearnCloud.get({ category }))?.map(
                                    (item: { uri: string }) => item.uri
                                ) ?? [];

                            terms.read.credentials.categories[category].shared =
                                allCategoryCredUris;
                        })
                    );

                    const enrichedTerms = await getTermsWithSharedUrisForWallet(
                        wallet,
                        ownerDid,
                        queryClient,
                        {
                            terms,
                            expiresAt: '',
                            oneTime: false,
                        }
                    );

                    await wallet.invoke.consentToContract(contractUri, {
                        terms: enrichedTerms.terms,
                        expiresAt: '',
                        oneTime: false,
                    });
                    await queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] });

                    return true;
                } catch (error) {
                    console.error('Failed to auto-consent to LearnCard AI contract:', error);
                    return false;
                } finally {
                    inFlightRef.current = null;
                }
            })();

            inFlightRef.current = run;
            return run;
        },
        [currentUser, initWallet, queryClient]
    );

    return { autoConsentLearnCardAi };
};

export default useAutoConsentLearnCardAi;

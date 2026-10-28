import { useQuery } from '@tanstack/react-query';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { useWallet } from 'learn-card-base/hooks/useWallet';

export const getLearningPathways = (sessions: VC[]) => {
    if (!sessions) return [];
    const learningPathways = sessions.flatMap(session => {
        const summaryInfo = unwrapBoostCredential(session)?.summaryInfo;
        // only proceed if there are nextSteps and at least one entry
        if (!summaryInfo?.nextSteps?.length) return [];

        const { summary, learned, skills, nextSteps } = summaryInfo;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
        return nextSteps.map((ns: any) => ({
            title: ns.title,
            description: ns.description,
            summary,
            learned,
            skills,
        }));
    });

    return learningPathways;
};

export const learningPathwaysQueryKey = (sessionUri?: string) =>
    ['useGetLearningPathwaysForSession', sessionUri] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
export const fetchLearningPathwaysForSession = async (wallet: any, sessionUri: string) => {
    const learningPathways = await wallet.invoke.getBoostChildren(sessionUri, {
        numberOfGenerations: 1,
        query: {
            category:
                categoryMetadata[CredentialCategoryEnum.aiPathway].contractCredentialTypeOverride,
        },
        limit: 100,
    });
    return Promise.all(
        learningPathways.records.map(async result => {
            const boost = await wallet.invoke.getBoost(result.uri);

            return {
                boost,
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain -- removing the assertion widens the type and needs a real null check
                learningPathway: boost.boost.learningPathway?.step!,
            };
        })
    );
};

export const useGetLearningPathwaysForSession = (sessionUri?: string) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: learningPathwaysQueryKey(sessionUri),
        queryFn: async () => {
            const wallet = await initWallet();
            return fetchLearningPathwaysForSession(wallet, sessionUri!);
        },
        enabled: !!sessionUri,
    });
};

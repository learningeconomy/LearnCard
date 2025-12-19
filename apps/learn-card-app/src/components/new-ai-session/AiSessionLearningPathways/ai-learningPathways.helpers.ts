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

export const useGetLearningPathwaysForSession = (sessionUri?: string) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useGetLearningPathwaysForSession', sessionUri],
        queryFn: async () => {
            const wallet = await initWallet();
            const learningPathways = await wallet.invoke.getBoostChildren(sessionUri!, {
                numberOfGenerations: 1,
                query: {
                    category:
                        categoryMetadata[CredentialCategoryEnum.aiPathway]
                            .contractCredentialTypeOverride,
                },
                limit: 100,
            });
            return Promise.all(
                learningPathways.records.map(async result => {
                    const boost = await wallet.invoke.getBoost(result.uri);

                    return {
                        boost,
                        learningPathway: boost.boost.learningPathway?.step!,
                    };
                })
            );
        },
        enabled: !!sessionUri,
    });
};

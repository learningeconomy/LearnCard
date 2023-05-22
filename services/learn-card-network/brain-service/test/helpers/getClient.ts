import { appRouter } from '../../src/app';
import { SeedLearnCard, getLearnCard } from '@helpers/learnCard.helpers';

export const getClient = (options?: { did?: string; isChallengeValid?: boolean }) => {
    const { did, isChallengeValid } = options ?? {};
    const domain = 'localhost%3A3000';

    if (!did) return appRouter.createCaller({ domain });

    return appRouter.createCaller({
        domain,
        user: { did, isChallengeValid: Boolean(isChallengeValid) },
    });
};

export const getUser = async (
    seed?: string
): Promise<{
    learnCard: SeedLearnCard;
    clients: {
        partialAuth: ReturnType<typeof getClient>;
        fullAuth: ReturnType<typeof getClient>;
    };
}> => {
    const learnCard = await getLearnCard(seed)!;
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({ did: learnCard.id.did(), isChallengeValid: true });

    return {
        learnCard,
        clients: { partialAuth, fullAuth },
    };
};

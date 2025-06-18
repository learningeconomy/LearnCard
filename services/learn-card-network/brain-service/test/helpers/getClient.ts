import { appRouter } from '../../src/app';
import { getLearnCard, type SeedLearnCard } from '@helpers/learnCard.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

export const getClient = (options?: {
    did?: string;
    isChallengeValid?: boolean;
    scope?: string;
}) => {
    const { did, isChallengeValid, scope } = options ?? {};
    const domain = 'localhost%3A3000';

    if (!did) return appRouter.createCaller({ domain });

    return appRouter.createCaller({
        domain,
        user: { did, isChallengeValid: Boolean(isChallengeValid), scope },
    });
};

export const getUser = async (
    seed?: string,
    scope?: string
): Promise<{
    learnCard: SeedLearnCard;
    clients: {
        partialAuth: ReturnType<typeof getClient>;
        fullAuth: ReturnType<typeof getClient>;
    };
}> => {
    const learnCard = await getLearnCard(seed)!;
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({
        did: learnCard.id.did(),
        isChallengeValid: true,
        scope: scope || AUTH_GRANT_FULL_ACCESS_SCOPE,
    });

    return {
        learnCard,
        clients: { partialAuth, fullAuth },
    };
};

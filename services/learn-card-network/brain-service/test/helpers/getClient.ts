import { readFile } from 'fs/promises';

import { appRouter } from '../../src/app';
import { initLearnCard, LearnCardFromSeed } from '@learncard/init';

let learnCards: Record<string, LearnCardFromSeed['returnValue']> = {};

const getLearnCard = async (seed = 'a'.repeat(64)): Promise<LearnCardFromSeed['returnValue']> => {
    if (!learnCards[seed]) {
        const didkit = await readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
        );

        const learnCard = await initLearnCard({ seed, didkit });

        learnCards[seed] = learnCard;
    }

    return learnCards[seed]!;
};

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
    learnCard: LearnCardFromSeed['returnValue'];
    clients: {
        partialAuth: ReturnType<typeof getClient>;
        fullAuth: ReturnType<typeof getClient>;
    };
}> => {
    const learnCard = await getLearnCard(seed);
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({ did: learnCard.id.did(), isChallengeValid: true });

    return {
        learnCard,
        clients: { partialAuth, fullAuth },
    };
};

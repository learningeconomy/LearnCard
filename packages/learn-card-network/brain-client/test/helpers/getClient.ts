import { readFile } from 'fs/promises';

import { appRouter } from '../../src/app';
import { initLearnCard, LearnCardFromSeed } from '@learncard/core';

let learnCards: Record<string, LearnCardFromSeed['returnValue']> = {};

const getLearnCard = async (seed = 'a'.repeat(64)): Promise<LearnCardFromSeed['returnValue']> => {
    if (!learnCards[seed]) {
        const didkit = await readFile(
            require.resolve('@learncard/core/src/didkit/pkg/didkit_wasm_bg.wasm')
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

export const getUser = async (did?: string) => {
    const learnCard = await getLearnCard(did);
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({ did: learnCard.id.did(), isChallengeValid: true });

    return {
        learnCard,
        clients: { partialAuth, fullAuth },
    };
};

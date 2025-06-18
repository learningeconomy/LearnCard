import { readFile } from 'fs/promises';

import { appRouter } from '../../src/app';
import { initLearnCard, type LearnCardFromSeed } from '@learncard/init';

const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));

let learnCards: Record<string, LearnCardFromSeed['returnValue']> = {};

const getLearnCard = async (seed = 'a'.repeat(64)): Promise<LearnCardFromSeed['returnValue']> => {
    if (!learnCards[seed]) {
        const learnCard = await initLearnCard({ seed, didkit });

        learnCards[seed] = learnCard;
    }

    return learnCards[seed]!;
};

export const getClient = (options?: {
    did?: string;
    isChallengeValid?: boolean;
    authorizedDid?: boolean;
}) => {
    const { did, isChallengeValid, authorizedDid } = options ?? {};
    const domain = 'localhost%3A3000';

    if (!did) return appRouter.createCaller({ domain });

    return appRouter.createCaller({
        domain,
        user: {
            did,
            isChallengeValid: Boolean(isChallengeValid),
            authorizedDid: Boolean(authorizedDid),
        },
    });
};

export const getUser = async (seed?: string) => {
    const learnCard = await getLearnCard(seed);
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({ did: learnCard.id.did(), isChallengeValid: true });
    const authorizedDidAuth = getClient({
        did: learnCard.id.did(),
        isChallengeValid: true,
        authorizedDid: true,
    });

    return {
        learnCard: learnCard as LearnCardFromSeed['returnValue'],
        clients: { partialAuth, fullAuth, authorizedDidAuth },
    };
};

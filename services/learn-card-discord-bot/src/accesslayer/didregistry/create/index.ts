import { randomUUID } from 'crypto';
import { DIDAssocation, DIDChallenge } from 'src/types/index';
import { Context } from 'src/types/index';

export const PREFIX = 'didassociation:';
export const CHALLENGE_PREFIX = 'didchallenge:';

export const createDIDAssociation = async (didAssociation: DIDAssocation, context: Context) => {
    if (!didAssociation._id) didAssociation._id = randomUUID();
    return context.cache.set(`${PREFIX}${didAssociation.source}`, JSON.stringify(didAssociation));
};

// Expires after 10 minutes.
export const createDIDChallenge = async (didChallenge: DIDChallenge, context: Context) => {
    if (!didChallenge._id) didChallenge._id = randomUUID();
    return context.cache.set(
        `${CHALLENGE_PREFIX}${didChallenge.source}`,
        JSON.stringify(didChallenge),
        600_000
    );
};

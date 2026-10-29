import type { VP } from '@learncard/types';
import type { getLearnCard } from '@helpers/learnCard.helpers';

export type DidAuthWallet = Awaited<ReturnType<typeof getLearnCard>>;

/** A wallet's DID-auth presentation for a VC-API exchange challenge (consent or claim). */
export const signDidAuth = async (
    wallet: DidAuthWallet,
    challenge: string,
    domain = 'localhost%3A3000'
): Promise<VP> => {
    const vp = await wallet.invoke.getDidAuthVp({
        challenge,
        domain,
        proofPurpose: 'authentication',
    });
    if (typeof vp === 'string') throw new Error('Expected a JSON-LD presentation');
    return vp;
};

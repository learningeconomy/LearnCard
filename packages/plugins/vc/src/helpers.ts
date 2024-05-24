import { VCImplicitLearnCard } from './types';

/**
 * Determines the default verification method to use for a given did by resolving it and looking
 * for a keypair that matches the default keypair for the LearnCard
 */
export const getDefaultVerificationMethod = async (
    learnCard: VCImplicitLearnCard,
    issuerDid: string
) => {
    const kp = learnCard.id.keypair();

    if (!kp) {
        throw new Error('Cannot get default verification method: unable to get subject keypair');
    }

    const issuerDidDoc = await learnCard.invoke.resolveDid(issuerDid);

    const verificationMethodEntry =
        typeof issuerDidDoc === 'string'
            ? undefined
            : issuerDidDoc?.verificationMethod?.find(entry =>
                typeof entry === 'string' ? false : entry?.publicKeyJwk?.x === kp.x
            );

    const verificationMethod =
        (typeof verificationMethodEntry !== 'string' && verificationMethodEntry?.id) ||
        (await learnCard.invoke.didToVerificationMethod(issuerDid));

    return verificationMethod;
};

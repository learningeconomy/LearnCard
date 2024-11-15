import { getEmptyLearnCard } from './learnCard.helpers';

export const areDidsEqual = async (did1: string, did2: string) => {
    try {
        if (did1 === did2) return true;

        const lc = await getEmptyLearnCard();

        const [resolvedDid1, resolvedDid2] = await Promise.all([
            lc.invoke.resolveDid(did1),
            lc.invoke.resolveDid(did2),
        ]);

        return resolvedDid1?.verificationMethod?.some(method1 => {
            return resolvedDid2?.verificationMethod?.some(
                method2 => (method1 as any)?.publicKeyJwk?.x === (method2 as any)?.publicKeyJwk?.x
            );
        });
    } catch (error) {
        console.error('Are dids equal error', error);
        return false;
    }
};

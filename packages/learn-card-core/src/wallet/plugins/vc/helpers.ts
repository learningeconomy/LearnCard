import { UnsignedVC, VC } from '@learncard/types';
import { VCImplicitLearnCard } from './types';

export const getIssuerDidDocFromVc = async (
    learnCard: VCImplicitLearnCard,
    credential: UnsignedVC | VC
): Promise<Record<string, any>> => {
    const did = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;

    return learnCard.invoke.resolveDid(did!);
};

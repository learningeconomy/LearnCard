import type { VP, VC } from '@learncard/types';

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) ? vcField[0] : vcField;
};

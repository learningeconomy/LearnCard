import type { VP, VC } from '@learncard/types';

export const getCredentialFromVp = (vp: VP): VC => {
    const field = vp.verifiableCredential;
    return (Array.isArray(field) ? field[0] : field) as VC;
};

export const areMultipleCredentials = (vp: VP): boolean =>
    Array.isArray(vp.verifiableCredential) && vp.verifiableCredential.length > 1;

export { CredentialReceivePage as default } from './CredentialReceivePage';

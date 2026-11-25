import type { VC } from '@learncard/types';

type PartnerCredentialStore = (
    credential: VC,
    metadata: { title: string },
    location: 'LearnCloud',
    skipLCNUser: true
) => Promise<{ result: boolean; credentialUri: string }>;

export const savePartnerCredential = async (
    credential: VC,
    store: PartnerCredentialStore
): Promise<string> => {
    const stored = await store(
        credential,
        { title: credential.name || 'Credential' },
        'LearnCloud',
        true
    );
    if (!stored.result || !stored.credentialUri) {
        throw new Error('Credential save was not confirmed');
    }
    return stored.credentialUri;
};

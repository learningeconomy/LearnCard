import { randomUUID } from 'node:crypto';
import cache from '@cache';

export type FederatedInboxCredential = {
    id: string;
    credential: unknown;
    recipientProfileId: string;
    senderServiceDid: string;
    issuerDid?: string;
    issuerDisplayName?: string;
    metadata?: Record<string, unknown>;
    status: 'PENDING_ACCEPTANCE' | 'PENDING_REGISTRATION' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
};

export type CreateFederatedInboxCredentialInput = {
    credential: unknown;
    recipientProfileId: string;
    senderServiceDid: string;
    issuerDid?: string;
    issuerDisplayName?: string;
    metadata?: Record<string, unknown>;
    status?: FederatedInboxCredential['status'];
};

const getCacheKey = (credentialId: string): string => `federated-inbox:${credentialId}`;
const getProfileIndexKey = (profileId: string): string => `federated-inbox:index:${profileId}`;

export const createFederatedInboxCredential = async (
    input: CreateFederatedInboxCredentialInput
): Promise<FederatedInboxCredential> => {
    const id = randomUUID();
    const credential: FederatedInboxCredential = {
        id,
        credential: input.credential,
        recipientProfileId: input.recipientProfileId,
        senderServiceDid: input.senderServiceDid,
        issuerDid: input.issuerDid,
        issuerDisplayName: input.issuerDisplayName,
        metadata: input.metadata,
        status: input.status || 'PENDING_ACCEPTANCE',
        createdAt: new Date().toISOString(),
    };

    await cache.set(getCacheKey(id), JSON.stringify(credential));

    const indexKey = getProfileIndexKey(input.recipientProfileId);
    await cache.rpush(indexKey, id);

    return credential;
};

export const getFederatedInboxCredentialById = async (
    id: string
): Promise<FederatedInboxCredential | null> => {
    const data = await cache.get(getCacheKey(id));
    if (!data) return null;
    return JSON.parse(data) as FederatedInboxCredential;
};

export const updateFederatedInboxCredentialStatus = async (
    id: string,
    status: FederatedInboxCredential['status']
): Promise<FederatedInboxCredential | null> => {
    const credential = await getFederatedInboxCredentialById(id);
    if (!credential) return null;

    const updated = { ...credential, status };
    await cache.set(getCacheKey(id), JSON.stringify(updated));
    return updated;
};

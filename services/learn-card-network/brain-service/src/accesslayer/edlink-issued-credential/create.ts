import { v4 as uuid } from 'uuid';
import {
    EdlinkIssuedCredential,
    EdlinkIssuedCredentialInstance,
    EdlinkIssuedCredentialProps,
    EdlinkConnection,
} from '@models';

export type CreateEdlinkIssuedCredentialInput = Omit<EdlinkIssuedCredentialProps, 'id'>;

export const createEdlinkIssuedCredential = async (
    input: CreateEdlinkIssuedCredentialInput
): Promise<EdlinkIssuedCredentialInstance> => {
    const { connectionId, ...data } = input;

    // Find the connection
    const connection = await EdlinkConnection.findOne({ where: { id: connectionId } });
    if (!connection) {
        throw new Error(`EdlinkConnection not found: ${connectionId}`);
    }

    // Create the issued credential record (includes connectionId as property)
    const issuedCredential = await EdlinkIssuedCredential.createOne({
        ...data,
        connectionId,
        id: uuid(),
    } as any);

    // Create relationship to connection
    await issuedCredential.relateTo({
        alias: 'issuedFrom',
        where: { id: connectionId },
        properties: { timestamp: new Date().toISOString() },
    });

    return issuedCredential;
};

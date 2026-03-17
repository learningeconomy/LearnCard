import { EdlinkIssuedCredential } from '@models';

/**
 * Delete an issued credential record by ID.
 * Useful for dev/debugging to retry issuance.
 */
export const deleteEdlinkIssuedCredential = async (id: string): Promise<boolean> => {
    const result = await EdlinkIssuedCredential.delete({ where: { id }, detach: true });
    return result > 0;
};

/**
 * Delete all issued credential records for a connection.
 * Useful for dev/debugging to retry all issuances.
 */
export const deleteAllIssuedCredentialsForConnection = async (connectionId: string): Promise<number> => {
    return EdlinkIssuedCredential.delete({ where: { connectionId }, detach: true });
};

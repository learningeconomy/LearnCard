import { EdlinkConnection, EdlinkConnectionInstance } from '@models';

export const getEdlinkConnections = async (): Promise<EdlinkConnectionInstance[]> => {
    return EdlinkConnection.findMany();
};

export const getEdlinkConnectionById = async (
    id: string
): Promise<EdlinkConnectionInstance | null> => {
    return EdlinkConnection.findOne({ where: { id } });
};

/**
 * Get all connections that have auto-issuance enabled.
 * Used by the polling service.
 */
export const getEdlinkConnectionsWithAutoIssue = async (): Promise<EdlinkConnectionInstance[]> => {
    return EdlinkConnection.findMany({
        where: { autoIssueCredentials: true },
    });
};

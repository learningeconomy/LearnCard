import { EdlinkConnection, EdlinkConnectionInstance } from '@models';

export const getEdlinkConnections = async (): Promise<EdlinkConnectionInstance[]> => {
    return EdlinkConnection.findMany();
};

export const getEdlinkConnectionById = async (
    id: string
): Promise<EdlinkConnectionInstance | null> => {
    return EdlinkConnection.findOne({ where: { id } });
};

import { getEdlinkConnectionById } from './read';

export const deleteEdlinkConnection = async (id: string): Promise<boolean> => {
    const connection = await getEdlinkConnectionById(id);
    if (!connection) return false;
    await connection.delete({ detach: true });
    return true;
};

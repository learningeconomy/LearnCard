import { Users } from '.';

export const deleteUserByDid = async (did: string): Promise<number | false> => {
    try {
        return (await Users.deleteOne({ did })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};

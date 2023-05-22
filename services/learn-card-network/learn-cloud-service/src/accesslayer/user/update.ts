import { Users } from '.';

export const addDidToUser = async (primaryDid: string, did: string): Promise<boolean> => {
    try {
        return Boolean(
            (await Users.updateOne({ did: primaryDid }, { $push: { associatedDids: did } }))
                .modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const removeDidFromUser = async (primaryDid: string, did: string): Promise<boolean> => {
    try {
        return Boolean(
            (await Users.updateOne({ did: primaryDid }, { $pull: { associatedDids: did } }))
                .modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const setDidAsPrimary = async (
    currentPrimary: string,
    newPrimary: string
): Promise<boolean> => {
    try {
        return Boolean(
            (
                await Users.updateOne(
                    { did: currentPrimary },
                    { $push: { associatedDids: currentPrimary }, $set: { did: newPrimary } }
                )
            ).modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

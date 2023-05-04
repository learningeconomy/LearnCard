import { Users } from '.';

export const incrementUserCursor = async (did: string, amt = 1): Promise<number | false> => {
    try {
        return (
            (
                await Users.findOneAndUpdate(
                    { did },
                    { $inc: { currentCursor: amt } },
                    { upsert: true, returnDocument: 'after' }
                )
            ).value?.currentCursor ?? false
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

import { SigningAuthorities } from '.';

export const deleteSigningAuthorityForDID = async (
    ownerDid: string,
    name: string
): Promise<number | false> => {
    console.log('Delete signing authority for user', ownerDid, name);
    try {
        return (
            await SigningAuthorities.deleteOne({
                ownerDid,
                name,
            })
        ).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};

import { Profile } from '@models';

export const checkIfProfileExists = async ({
    did,
    handle,
    email,
}: {
    did?: string;
    handle?: string;
    email?: string;
}): Promise<boolean> => {
    if (!did && !handle && !email) return false;

    if (did && (await Profile.findOne({ where: { did } }))) return true;
    if (handle && (await Profile.findOne({ where: { handle } }))) return true;
    if (email && (await Profile.findOne({ where: { email } }))) return true;

    return false;
};

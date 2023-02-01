import { Profile } from '@models';

export const checkIfProfileExists = async ({
    did,
    handle,
}: {
    did?: string;
    handle?: string;
}): Promise<boolean> => {
    if (!did && !handle) return false;

    if (did && (await Profile.findOne({ where: { did } }))) return true;
    if (handle && (await Profile.findOne({ where: { handle } }))) return true;

    return false;
};

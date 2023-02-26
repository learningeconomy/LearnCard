import { BoostInstance, ProfileInstance } from '@models';

export const getBoostOwner = async (boost: BoostInstance): Promise<ProfileInstance | undefined> => {
    return (await boost.findRelationships({ alias: 'createdBy' }))[0]?.target;
};

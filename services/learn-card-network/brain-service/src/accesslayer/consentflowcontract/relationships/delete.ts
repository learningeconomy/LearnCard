import { Profile } from '@models';

export const deleteTermsById = async (id: string): Promise<number> => {
    return Profile.deleteRelationships({ alias: 'consentsTo', where: { relationship: { id } } });
};

import { Boost, BoostInstance } from '@models';

export const getBoostById = async (id: string): Promise<BoostInstance | null> => {
    return Boost.findOne({ where: { id } });
};

import type { BoostInstance } from '@models';

export const deleteBoost = async (boost: BoostInstance): Promise<void> => {
    await boost.delete({ detach: true });
};

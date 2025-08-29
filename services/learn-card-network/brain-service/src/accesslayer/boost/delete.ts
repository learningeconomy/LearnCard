import { BoostInstance } from '@models';
import { removeAutoConnectRecipientRelationshipsForBoost } from './relationships/delete';

export const deleteBoost = async (boost: BoostInstance): Promise<void> => {
    // Clean up explicit auto-connect recipient relationships first for clarity
    await removeAutoConnectRecipientRelationshipsForBoost(boost);

    await boost.delete({ detach: true });
};

import { BoostInstance } from '@models';
import { removeAutoConnectRecipientRelationshipsForBoost } from './relationships/delete';
import { removeConnectionsForBoost } from '@helpers/connection.helpers';

export const deleteBoost = async (boost: BoostInstance): Promise<void> => {
    // Clean up explicit auto-connect recipient relationships first for clarity
    await removeAutoConnectRecipientRelationshipsForBoost(boost);

    // Remove any CONNECTED_WITH sources that originated from this boost
    await removeConnectionsForBoost(boost.id);

    await boost.delete({ detach: true });
};

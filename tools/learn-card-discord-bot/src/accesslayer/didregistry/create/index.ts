import { randomUUID } from 'crypto';
import { DIDAssocation } from 'src/types/index';
import { Context } from 'src/types/index';

export const PREFIX = 'didassociation:';

export const createDIDAssociation = async (didAssociation: DIDAssocation, context: Context) => {
    if (!didAssociation._id) didAssociation._id = randomUUID();
    return context.cache.set(`${PREFIX}${didAssociation.source}`, JSON.stringify(didAssociation));
};

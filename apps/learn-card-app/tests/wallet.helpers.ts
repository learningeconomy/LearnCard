/// <reference path="./global.d.ts" />

import { initLearnCard } from '@learncard/init';
import { getLCAPlugin, LCALearnCard } from '@welibraryos/lca-api-plugin';

export type BespokeLearnCard = LCALearnCard;
export const getBespokeLearnCard = async (seed: string): Promise<BespokeLearnCard> => {
    const network = 'http://localhost:4000/trpc';
    const cloudUrl = 'http://localhost:4100/trpc';
    const apiEndpoint = 'http://localhost:5100/trpc';

    const networkLearnCard = await initLearnCard({
        seed,
        network: network,
        cloud: { url: cloudUrl },
        allowRemoteContexts: true,
    });

    return networkLearnCard.addPlugin(await getLCAPlugin(networkLearnCard, apiEndpoint));
};

import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';

// Both accounts must already have profiles on the chosen network.
export const initializeReferralClients = async ({
    partnerSeed,
    referrerSeed,
    networkUrl,
    lcaApiUrl,
    clientOptions = {},
}) => {
    const partnerAccount = await initLearnCard({
        ...clientOptions,
        seed: partnerSeed,
        network: networkUrl,
    });
    const partner = await partnerAccount.addPlugin(await getLCAPlugin(partnerAccount, lcaApiUrl));
    const referrer = await initLearnCard({
        ...clientOptions,
        seed: referrerSeed,
        network: networkUrl,
    });
    return { partner, referrer };
};

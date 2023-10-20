import { generateLearnCard } from '@learncard/core';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';

import { EmptyLearnCard } from 'types/LearnCard';

/**
 * Generates an empty wallet with no key material
 *
 * @group Init Functions
 */
export const emptyLearnCard = async ({
    didkit,
    allowRemoteContexts = false,
    debug,
}: EmptyLearnCard['args'] = {}): Promise<EmptyLearnCard['returnValue']> => {
    const dynamicLc = await (await generateLearnCard({ debug })).addPlugin(DynamicLoaderPlugin);

    const cryptoLc = await dynamicLc.addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit, allowRemoteContexts));

    const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

    const templatesLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

    const chapiLc = await templatesLc.addPlugin(await getCHAPIPlugin());

    return chapiLc.addPlugin(getLearnCardPlugin(chapiLc));
};

import { generateLearnCard } from '@learncard/core';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { getDidKitPlugin, type DidMethod } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { getLearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import { getEthereumPlugin } from '@learncard/ethereum-plugin';
import { getVpqrPlugin } from '@learncard/vpqr-plugin';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin } from '@learncard/did-web-plugin';

import type { DidWebLearnCardFromSeed } from '../types/LearnCard';
import { defaultEthereumArgs } from '../defaults';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const didWebLearnCardFromSeed = async ({
    seed,
    didWeb,
    cloud: {
        url = 'https://cloud.learncard.com/trpc',
        unencryptedFields = [],
        unencryptedCustomFields = [],
        automaticallyAssociateDids = true,
    } = {},
    didkit,
    allowRemoteContexts = false,
    ethereumConfig = defaultEthereumArgs,
    debug,
}: DidWebLearnCardFromSeed['args']): Promise<DidWebLearnCardFromSeed['returnValue']> => {
    const dynamicLc = await (await generateLearnCard({ debug })).addPlugin(DynamicLoaderPlugin);

    const cryptoLc = await dynamicLc.addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit, allowRemoteContexts));

    const didkeyLc = await didkitLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
    );

    const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

    const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

    const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

    const cloudLc = await templateLc.addPlugin(
        await getLearnCloudPlugin(
            templateLc,
            url,
            unencryptedFields,
            unencryptedCustomFields,
            automaticallyAssociateDids
        )
    );

    const expirationLc = await cloudLc.addPlugin(expirationPlugin(cloudLc));

    const ethLc = await expirationLc.addPlugin(getEthereumPlugin(expirationLc, ethereumConfig));

    const vpqrLc = await ethLc.addPlugin(getVpqrPlugin(ethLc));

    const chapiLc = await vpqrLc.addPlugin(await getCHAPIPlugin());

    const lcLc = await chapiLc.addPlugin(getLearnCardPlugin(chapiLc));

    return lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));
};

import { generateLearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { DidMethod, getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { getCeramicPlugin } from '@learncard/ceramic-plugin';
import { getLearnCloudPlugin } from '@learncard/learn-cloud-plugin';
import { getIDXPlugin } from '@learncard/idx-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import { getEthereumPlugin } from '@learncard/ethereum-plugin';
import { getVpqrPlugin } from '@learncard/vpqr-plugin';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin } from '@learncard/did-web-plugin';

import { DidWebLearnCardFromSeed } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from '../defaults';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const didWebLearnCardFromSeed = async ({
    seed,
    didWeb,
    cloud: { url = 'https://cloud.learncard.com/trpc', unencryptedFields = [] } = {},
    ceramicIdx = defaultCeramicIDXArgs,
    didkit,
    ethereumConfig = defaultEthereumArgs,
    debug,
}: DidWebLearnCardFromSeed['args']): Promise<DidWebLearnCardFromSeed['returnValue']> => {
    const cryptoLc = await (await generateLearnCard({ debug })).addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit));

    const didkeyLc = await didkitLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
    );

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const templateLc = await didkeyAndVCLc.addPlugin(getVCTemplatesPlugin());

    const ceramicLc = await templateLc.addPlugin(await getCeramicPlugin(templateLc, ceramicIdx));

    const cloudLc = await ceramicLc.addPlugin(
        await getLearnCloudPlugin(ceramicLc, url, unencryptedFields)
    );

    const idxLc = await cloudLc.addPlugin(await getIDXPlugin(cloudLc, ceramicIdx));

    const expirationLc = await idxLc.addPlugin(expirationPlugin(idxLc));

    const ethLc = await expirationLc.addPlugin(getEthereumPlugin(expirationLc, ethereumConfig));

    const vpqrLc = await ethLc.addPlugin(getVpqrPlugin(ethLc));

    const chapiLc = await vpqrLc.addPlugin(await getCHAPIPlugin());

    const lcLc = await chapiLc.addPlugin(getLearnCardPlugin(chapiLc));

    return lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));
};

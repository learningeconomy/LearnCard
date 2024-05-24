import { generateLearnCard } from '@learncard/core';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
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
import { getVerifyBoostPlugin, getLearnCardNetworkPlugin } from '@learncard/network-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin } from '@learncard/did-web-plugin';

import { DidWebNetworkLearnCardFromSeed } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultEthereumArgs } from '../defaults';

/**
 * Generates a Network LearnCard Wallet with a custom did:web did from a 64 character seed string
 *
 * @group Init Functions
 */
export const didWebNetworkLearnCardFromSeed = async ({
    seed,
    didWeb,
    network: _network,
    trustedBoostRegistry,

    cloud: {
        url = 'https://cloud.learncard.com/trpc',
        unencryptedFields = [],
        unencryptedCustomFields = [],
    } = {},
    ceramicIdx = defaultCeramicIDXArgs,
    didkit,
    allowRemoteContexts = false,
    ethereumConfig = defaultEthereumArgs,
    debug,
}: DidWebNetworkLearnCardFromSeed['args']): Promise<
    DidWebNetworkLearnCardFromSeed['returnValue']
> => {
    const network = typeof _network === 'boolean' ? 'https://network.learncard.com/trpc' : _network;

    const dynamicLc = await (await generateLearnCard({ debug })).addPlugin(DynamicLoaderPlugin);

    const cryptoLc = await dynamicLc.addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit, allowRemoteContexts));

    const didkeyLc = await didkitLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
    );

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const templateLc = await didkeyAndVCLc.addPlugin(getVCTemplatesPlugin());

    const ceramicLc = await templateLc.addPlugin(await getCeramicPlugin(templateLc, ceramicIdx));

    const cloudLc = await ceramicLc.addPlugin(
        await getLearnCloudPlugin(ceramicLc, url, unencryptedFields, unencryptedCustomFields)
    );

    const idxLc = await cloudLc.addPlugin(await getIDXPlugin(cloudLc, ceramicIdx));

    const expirationLc = await idxLc.addPlugin(expirationPlugin(idxLc));

    const ethLc = await expirationLc.addPlugin(getEthereumPlugin(expirationLc, ethereumConfig));

    const vpqrLc = await ethLc.addPlugin(getVpqrPlugin(ethLc));

    const chapiLc = await vpqrLc.addPlugin(await getCHAPIPlugin());

    const boostVerificationLc = await chapiLc.addPlugin(
        await getVerifyBoostPlugin(chapiLc, trustedBoostRegistry)
    );

    const lcLc = await boostVerificationLc.addPlugin(getLearnCardPlugin(boostVerificationLc));

    const didWebLc = await lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));

    return didWebLc.addPlugin(await getLearnCardNetworkPlugin(didWebLc, network));
};

import { generateLearnCard } from '@learncard/core';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import { getVpqrPlugin } from '@learncard/vpqr-plugin';
import { getCHAPIPlugin } from '@learncard/chapi-plugin';
import { getVerifyBoostPlugin, getLearnCardNetworkPlugin } from '@learncard/network-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';

import { NetworkLearnCardFromApiKey } from '../types/LearnCard';

/**
 * Generates a Network LearnCard Wallet from an API key (no local seed required)
 *
 * @group Init Functions
 */
export const networkLearnCardFromApiKey = async ({
    apiKey,
    network: _network,
    trustedBoostRegistry = 'https://raw.githubusercontent.com/learningeconomy/registries/main/learncard/trusted-app-registry.json',
    didkit,
    allowRemoteContexts = false,
    debug,
}: NetworkLearnCardFromApiKey['args']): Promise<NetworkLearnCardFromApiKey['returnValue']> => {
    const network = typeof _network === 'boolean' ? 'https://network.learncard.com/trpc' : _network;

    const dynamicLc = await (await generateLearnCard({ debug })).addPlugin(DynamicLoaderPlugin);

    const cryptoLc = await dynamicLc.addPlugin(CryptoPlugin);

    const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(didkit, allowRemoteContexts));

    const vcLc = await didkitLc.addPlugin(getVCPlugin(didkitLc));

    const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

    const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

    const vpqrLc = await expirationLc.addPlugin(getVpqrPlugin(expirationLc));

    const chapiLc = await vpqrLc.addPlugin(await getCHAPIPlugin());

    const boostVerificationLc = await chapiLc.addPlugin(
        await getVerifyBoostPlugin(chapiLc, trustedBoostRegistry)
    );

    const lcLc = await boostVerificationLc.addPlugin(getLearnCardPlugin(boostVerificationLc));

    return lcLc.addPlugin(await getLearnCardNetworkPlugin(lcLc, network, apiKey));
};

import { generateLearnCard } from '@wallet/base';
import { DidMethod, getDidKitPlugin } from '@wallet/plugins/didkit';
import { getDidKeyPlugin } from '@wallet/plugins/didkey';
import { getVCPlugin } from '@wallet/plugins/vc';
import { getVCTemplatesPlugin } from '@wallet/plugins/vc-templates';
import { VCResolutionPlugin } from '@wallet/plugins/vc-resolution';
import { getCeramicPlugin } from '@wallet/plugins/ceramic';
import { getIDXPlugin } from '@wallet/plugins/idx';
import { expirationPlugin } from '@wallet/plugins/expiration';
import { getEthereumPlugin } from '@wallet/plugins/EthereumPlugin';
import { getVpqrPlugin } from '@wallet/plugins/vpqr';
import { getCHAPIPlugin } from '@wallet/plugins/chapi';
import { getLearnCardPlugin } from '@wallet/plugins/learn-card';

import { getDWNPlugin } from '@wallet/plugins/dwn';

import { LearnCardConfig, LearnCardFromSeed } from 'types/LearnCard';
import { defaultCeramicIDXArgs, defaultDWNArgs, defaultEthereumArgs } from '@wallet/defaults';

/**
 * Generates a LearnCard Wallet from a 64 character seed string
 *
 * @group Init Functions
 */
export const learnCardFromSeed = async (
    seed: string,
    {
        ceramicIdx = defaultCeramicIDXArgs,
        didkit,
        ethereumConfig = defaultEthereumArgs,
        dwnConfig = defaultDWNArgs,
        debug,
    }: Partial<LearnCardConfig> = {}
): Promise<LearnCardFromSeed['returnValue']> => {
    const didkitLc = await (
        await generateLearnCard({ debug })
    ).addPlugin(await getDidKitPlugin(didkit));

    const didkeyLc = await didkitLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
    );

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const templateLc = await didkeyAndVCLc.addPlugin(getVCTemplatesPlugin());

    const resolutionLc = await templateLc.addPlugin(VCResolutionPlugin);

    const ceramicLc = await resolutionLc.addPlugin(
        await getCeramicPlugin(resolutionLc, ceramicIdx)
    );

    const idxLc = await ceramicLc.addPlugin(await getIDXPlugin(ceramicLc, ceramicIdx));
    const expirationLc = await idxLc.addPlugin(expirationPlugin(idxLc));

    const ethLc = await expirationLc.addPlugin(getEthereumPlugin(expirationLc, ethereumConfig));

    const vpqrLc = await ethLc.addPlugin(getVpqrPlugin(ethLc));

    const chapiLc = await vpqrLc.addPlugin(await getCHAPIPlugin());

    const dwnLc = await chapiLc.addPlugin(getDWNPlugin(dwnConfig));

    return dwnLc.addPlugin(getLearnCardPlugin(dwnLc));
};
